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

export class CourseController {
  /**
   * Create a new course
   */
  static createCourse = catchAsync(async (req: Request, res: Response) => {
    let courseData: ICourse;
    
    // Parse JSON data from form-data
    try {
      courseData = JSON.parse(req.body.courseData);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid course data format");
    }

    // Handle thumbnail upload if provided
    if (req.file) {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "course_thumbnails",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload thumbnail");
            }
            courseData.thumbnail = {
              public_id: result!.public_id,
              url: result!.secure_url,
            };
            // Continue with course creation after upload
            CourseService.createCourse(courseData).then((course) => {
              res.status(httpStatus.CREATED).json({
                success: true,
                data: course,
                meta: {},
              } as IGenericResponse<ICourse>);
            }).catch((err) => {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create course");
            });
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload thumbnail");
      }
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Thumbnail is required");
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
   * Update a course
   */
  static updateCourse = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    let courseData: ICourse;
    
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }

    // Parse JSON data from form-data
    try {
      courseData = JSON.parse(req.body.courseData);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid course data format");
    }

    // Handle thumbnail upload if provided
    if (req.file) {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "course_thumbnails",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload thumbnail");
            }
            courseData.thumbnail = {
              public_id: result!.public_id,
              url: result!.secure_url,
            };
            // Continue with course update after upload
            CourseService.updateCourse(id, courseData).then((course) => {
              res.status(httpStatus.OK).json({
                success: true,
                data: course,
                meta: {},
              } as IGenericResponse<ICourse>);
            }).catch((err) => {
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update course");
            });
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload thumbnail");
      }
    } else {
      // Update course without changing thumbnail
      const course = await CourseService.updateCourse(id, courseData);
      res.status(httpStatus.OK).json({
        success: true,
        data: course,
        meta: {},
      } as IGenericResponse<ICourse>);
    }
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
;
