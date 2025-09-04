
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { CourseService } from "./course.service";
import { IGenericResponse } from "../../../interfaces/common";
import { IUserResponse } from "../user/user.interface";
import { ICourse, ILecture, IModule } from "./course.interface";
import ApiError from "../../../errors/Apierror";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import * as crypto from "crypto";

export class CourseController {
  /**
   * Create a new course
   */
  static createCourse = catchAsync(async (req: Request, res: Response) => {
    let courseData: ICourse & { pdfNotesIndices?: Record<string, number> };

    // Parse JSON data from form-data
    try {
      courseData = JSON.parse(req.body.courseData);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid course data format");
    }

    // Handle thumbnail upload
    if (
      !req.files ||
      !("thumbnail" in req.files) ||
      !req.files["thumbnail"][0]
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Thumbnail is required");
    }

    const thumbnailFile = req.files["thumbnail"][0];
    const pdfFiles =
      req.files && "pdfNotes" in req.files ? req.files["pdfNotes"] : [];

    try {
      // Upload thumbnail to Cloudinary
      const thumbnailUpload = new Promise<{ public_id: string; url: string }>(
        (resolve, reject) => {
          const filenameWithoutExt = thumbnailFile.originalname.replace(
            /\.[^/.]+$/,
            ""
          );
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "course_thumbnails",
              resource_type: "image",
              public_id: `${crypto.randomUUID()}-${filenameWithoutExt}`,
            },
            (error, result) => {
              if (error || !result) {
                reject(
                  new ApiError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to upload thumbnail"
                  )
                );
              } else {
                resolve({
                  public_id: result.public_id,
                  url: result.secure_url,
                });
              }
            }
          );
          streamifier.createReadStream(thumbnailFile.buffer).pipe(uploadStream);
        }
      );

      // Upload PDFs to Cloudinary
      const pdfUploads = pdfFiles.map((file, index) => {
        return new Promise<{ public_id: string; url: string }>(
          (resolve, reject) => {
            if (file.mimetype !== "application/pdf") {
              reject(
                new ApiError(
                  httpStatus.BAD_REQUEST,
                  `File ${index + 1} is not a PDF`
                )
              );
            }
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "course_pdfs",
                resource_type: "raw",
                public_id: `${crypto.randomUUID()}-${file.originalname}`,
              },
              (error, result) => {
                if (error || !result) {
                  reject(
                    new ApiError(
                      httpStatus.INTERNAL_SERVER_ERROR,
                      `Failed to upload PDF ${index + 1}`
                    )
                  );
                } else {
                  resolve({
                    public_id: result.public_id,
                    url: result.secure_url,
                  });
                }
              }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          }
        );
      });

      const [thumbnailResult, ...pdfResults] = await Promise.all([
        thumbnailUpload,
        ...pdfUploads,
      ]);

      courseData.thumbnail = thumbnailResult;

      // Map PDFs to lectures using pdfNotesIndices from courseData
      const pdfMap: Record<string, { public_id: string; url: string }[]> = {};
      if (courseData.pdfNotesIndices) {
        Object.entries(courseData.pdfNotesIndices).forEach(
          ([key, pdfIndex]) => {
            if (pdfResults[pdfIndex]) {
              if (!pdfMap[key]) pdfMap[key] = [];
              pdfMap[key].push(pdfResults[pdfIndex]);
            }
          }
        );
      }

      // Update courseData with PDFs
      courseData.modules = courseData.modules.map((module, mIndex) => ({
        ...module,
        lectures: module.lectures.map((lecture, lIndex) => ({
          ...lecture,
          pdfNotes: pdfMap[`${mIndex}-${lIndex}`] || lecture.pdfNotes || [],
        })),
      }));

      // Remove pdfNotesIndices from courseData before saving
      delete courseData.pdfNotesIndices;

      const course = await CourseService.createCourse(courseData);
      res.status(httpStatus.CREATED).json({
        success: true,
        data: course,
        meta: {},
      } as IGenericResponse<ICourse>);
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create course"
      );
    }
  });

  /**
   * Update a course
   */
  static updateCourse = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    let courseData: Partial<ICourse> & {
      pdfNotesIndices?: Record<string, number>;
    };

    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }

    // Parse JSON data from form-data
    try {
      courseData = JSON.parse(req.body.courseData);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid course data format");
    }

    const thumbnailFile =
      req.files && "thumbnail" in req.files ? req.files["thumbnail"][0] : null;
    const pdfFiles =
      req.files && "pdfNotes" in req.files ? req.files["pdfNotes"] : [];

    try {
      // Handle thumbnail upload if provided
      if (thumbnailFile) {
        if (!thumbnailFile.mimetype.startsWith("image/")) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Thumbnail must be an image"
          );
        }

        const filenameWithoutExt = thumbnailFile.originalname.replace(
          /\.[^/.]+$/,
          ""
        );
        const thumbnailResult = await new Promise<{
          public_id: string;
          url: string;
        }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "course_thumbnails",
              resource_type: "image",
              public_id: `${crypto.randomUUID()}-${filenameWithoutExt}`,
            },
            (error, result) => {
              if (error || !result) {
                reject(
                  new ApiError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    `Failed to upload thumbnail: ${
                      error?.message || "Unknown error"
                    }`
                  )
                );
              } else {
                resolve({
                  public_id: result.public_id,
                  url: result.secure_url,
                });
              }
            }
          );
          streamifier.createReadStream(thumbnailFile.buffer).pipe(uploadStream);
        });

        courseData.thumbnail = thumbnailResult;
      }

      // Handle PDF uploads
      const pdfUploads = pdfFiles.map((file, index) => {
        return new Promise<{ public_id: string; url: string }>(
          (resolve, reject) => {
            if (file.mimetype !== "application/pdf") {
              reject(
                new ApiError(
                  httpStatus.BAD_REQUEST,
                  `File ${index + 1} is not a PDF`
                )
              );
              return;
            }

            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "course_pdfs",
                resource_type: "raw",
                public_id: `${crypto.randomUUID()}-${file.originalname}`,
              },
              (error, result) => {
                if (error || !result) {
                  reject(
                    new ApiError(
                      httpStatus.INTERNAL_SERVER_ERROR,
                      `Failed to upload PDF ${index + 1}: ${
                        error?.message || "Unknown error"
                      }`
                    )
                  );
                } else {
                  resolve({
                    public_id: result.public_id,
                    url: result.secure_url,
                  });
                }
              }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          }
        );
      });

      const pdfResults = await Promise.all(pdfUploads);

      // Map new PDFs to lectures using pdfNotesIndices from courseData
      const newPdfMap: Record<string, { public_id: string; url: string }[]> =
        {};
      if (courseData.pdfNotesIndices && pdfResults.length > 0) {
        Object.entries(courseData.pdfNotesIndices).forEach(
          ([key, pdfIndex]) => {
            if (pdfResults[pdfIndex]) {
              if (!newPdfMap[key]) newPdfMap[key] = [];
              newPdfMap[key].push(pdfResults[pdfIndex]);
            }
          }
        );
      }

      // Helper function to validate PDF note
      const isValidPdfNote = (
        pdf: any
      ): pdf is { public_id: string; url: string } => {
        return (
          pdf &&
          typeof pdf === "object" &&
          typeof pdf.public_id === "string" &&
          typeof pdf.url === "string" &&
          pdf.public_id.trim() !== "" &&
          pdf.url.trim() !== ""
        );
      };

      // Process modules if they exist in courseData
      if (courseData.modules && Array.isArray(courseData.modules)) {
        courseData.modules = courseData.modules.map((module, mIndex) => {
          // Preserve module _id if it exists
          const processedModule: any = {
            ...module,
            lectures: Array.isArray(module.lectures)
              ? module.lectures.map((lecture, lIndex) => {
                  const lectureKey = `${mIndex}-${lIndex}`;

                  // Filter and validate existing PDFs from the lecture
                  let existingPdfs: { public_id: string; url: string }[] = [];
                  if (Array.isArray(lecture.pdfNotes)) {
                    existingPdfs = lecture.pdfNotes.filter(isValidPdfNote);
                  }

                  // Add new PDFs for this lecture
                  const newPdfs = newPdfMap[lectureKey] || [];

                  // Combine and ensure all PDFs are valid
                  const allPdfs = [...existingPdfs, ...newPdfs].filter(
                    isValidPdfNote
                  );

                  // Preserve lecture _id if it exists
                  return {
                    ...lecture,
                    pdfNotes: allPdfs,
                  };
                })
              : [],
          };

          return processedModule;
        });
      }

      // Remove pdfNotesIndices from courseData before saving
      delete courseData.pdfNotesIndices;

      // Log the final data structure for debugging (remove in production)
      console.log(
        "Final courseData structure:",
        JSON.stringify(courseData, null, 2)
      );

      // Update the course
      const course = await CourseService.updateCourse(id, courseData);

      res.status(httpStatus.OK).json({
        success: true,
        data: course,
        meta: {},
      } as IGenericResponse<ICourse>);
    } catch (error) {
      // Log the actual error for debugging
      console.error("Course update error:", error);

      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }

      // For other errors, provide more context
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update course: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });

  /**
   * Get all courses
   */
  static getAllCourses = catchAsync(async (req: Request, res: Response) => {
    const courses = await CourseService.getAllCourses();
    res.status(httpStatus.OK).json({
      success: true,
      data: courses,
      meta: { total: courses.length },
    } as IGenericResponse<ICourse[]>);
  });

  /**
   * Get a single course by ID
   */
  static getCourseById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }
    const course = await CourseService.getCourseById(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: course,
      meta: {},
    } as IGenericResponse<ICourse>);
  });

  /**
   * Delete a course
   */
  static deleteCourse = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }
    await CourseService.deleteCourse(id);
    res.status(httpStatus.OK).json({
      success: true,
      data: null,
      meta: {},
      message: "Course deleted successfully",
    } as IGenericResponse<null>);
  });

  /**
   * Add a new module to a course
   */
  static addModule = catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const moduleData = req.body;
    if (!courseId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }
    const module = await CourseService.addModule(courseId, moduleData);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: module,
      meta: {},
      message: "Module added successfully",
    } as IGenericResponse<IModule>);
  });

  /**
   * Update a module
   */
  static updateModule = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    const updateData = req.body;
    if (!courseId || !moduleId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Course ID and module ID are required"
      );
    }
    const module = await CourseService.updateModule(
      courseId,
      moduleId,
      updateData
    );
    res.status(httpStatus.OK).json({
      success: true,
      data: module,
      meta: {},
      message: "Module updated successfully",
    } as IGenericResponse<IModule>);
  });

  /**
   * Delete a module
   */
  static deleteModule = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    if (!courseId || !moduleId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Course ID and module ID are required"
      );
    }
    await CourseService.deleteModule(courseId, moduleId);
    res.status(httpStatus.OK).json({
      success: true,
      data: null,
      meta: {},
      message: "Module deleted successfully",
    } as IGenericResponse<null>);
  });

  /**
   * Add a new lecture to a module
   */
  static addLecture = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    const lectureData = req.body;
    if (!courseId || !moduleId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Course ID and module ID are required"
      );
    }
    const lecture = await CourseService.addLecture(
      courseId,
      moduleId,
      lectureData
    );
    res.status(httpStatus.CREATED).json({
      success: true,
      data: lecture,
      meta: {},
      message: "Lecture added successfully",
    } as IGenericResponse<ILecture>);
  });

  /**
   * Update a lecture
   */
  static updateLecture = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId, lectureId } = req.params;
    const updateData = req.body;
    if (!courseId || !moduleId || !lectureId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Course ID, module ID, and lecture ID are required"
      );
    }
    const lecture = await CourseService.updateLecture(
      courseId,
      moduleId,
      lectureId,
      updateData
    );
    res.status(httpStatus.OK).json({
      success: true,
      data: lecture,
      meta: {},
      message: "Lecture updated successfully",
    } as IGenericResponse<ILecture>);
  });

  /**
   * Delete a lecture
   */
  static deleteLecture = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId, lectureId } = req.params;
    if (!courseId || !moduleId || !lectureId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Course ID, module ID, and lecture ID are required"
      );
    }
    await CourseService.deleteLecture(courseId, moduleId, lectureId);
    res.status(httpStatus.OK).json({
      success: true,
      data: null,
      meta: {},
      message: "Lecture deleted successfully",
    } as IGenericResponse<null>);
  });

  /**
   * Get all lectures with optional filters
   */
  static getLectures = catchAsync(async (req: Request, res: Response) => {
    const { courseId, moduleId, search } = req.query;
    const lectures = await CourseService.getLectures({
      courseId: courseId as string,
      moduleId: moduleId as string,
      search: search as string,
    });
    res.status(httpStatus.OK).json({
      success: true,
      data: lectures,
      meta: { total: lectures.length },
    } as IGenericResponse<ILecture[]>);
  });

  /**
   * Enroll in a course
   */
  static enrollInCourse = catchAsync(async (req: Request, res: Response) => {
    const { id: courseId } = req.params;
    const userId = req.user?.id;
    if (!courseId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }
    const user = await CourseService.enrollInCourse(courseId, userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: user,
      meta: {},
      message: "Enrolled in course successfully",
    } as IGenericResponse<IUserResponse>);
  });

  /**
   * Mark a lecture as complete
   */
  static markLectureComplete = catchAsync(
    async (req: Request, res: Response) => {
      const { courseId, moduleId, lectureId } = req.params;
      const userId = req.user?.id;
      if (!courseId || !moduleId || !lectureId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Course ID, module ID, and lecture ID are required"
        );
      }
      if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
      }
      const user = await CourseService.markLectureComplete(
        courseId,
        moduleId,
        lectureId,
        userId
      );
      res.status(httpStatus.OK).json({
        success: true,
        data: user,
        meta: {},
        message: "Lecture marked as complete",
      } as IGenericResponse<IUserResponse>);
    }
  );
}
