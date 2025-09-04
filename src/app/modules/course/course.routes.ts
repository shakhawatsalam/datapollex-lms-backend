import express from "express";
import multer from "multer";
import { CourseController } from "./course.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../../enums/user";
import httpStatus from "http-status";
import ApiError from "../../../errors/Apierror";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Define fields for file uploads
const uploadFields = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "pdfNotes", maxCount: 50 }, // Expect multiple files under 'pdfNotes'
]);

// Custom Multer error-handling middleware
const handleMulterError = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      // Log the fields received for debugging
      console.log(
        "Received FormData fields:",
        Object.keys(req.body),
        Object.keys(req.files || {})
      );
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Unexpected field in FormData: ${err.field}. Expected fields: 'thumbnail' (single file), 'pdfNotes' (multiple files).`
      );
    } else if (err.code === "LIMIT_FILE_SIZE") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `File size exceeds 10 MB limit: ${err.field}`
      );
    }
    throw new ApiError(httpStatus.BAD_REQUEST, `Multer error: ${err.message}`);
  }
  next(err);
};

/**
 * @route POST /api/v1/courses
 * @desc Create a new course with thumbnail and optional PDFs
 * @access Private (requires JWT, admin role)
 */
router.post(
  "/",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFields,
  handleMulterError,
  CourseController.createCourse
);

/**
 * @route GET /api/v1/courses
 * @desc Get all courses
 * @access Public
 */
router.get("/", CourseController.getAllCourses);

/**
 * @route GET /api/v1/courses/:id
 * @desc Get a single course by ID
 * @access Public
 */
router.get("/:id", CourseController.getCourseById);

/**
 * @route PATCH /api/v1/courses/:id
 * @desc Update a course with optional thumbnail and PDFs
 * @access Private (requires JWT, admin role)
 */
router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFields,
  handleMulterError,
  CourseController.updateCourse
);

/**
 * @route DELETE /api/v1/courses/:id
 * @desc Delete a course
 * @access Private (requires JWT, admin role)
 */
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.deleteCourse
);

/**
 * @route POST /api/v1/courses/:courseId/modules
 * @desc Add a new module to a course
 * @access Private (requires JWT, admin role)
 */
router.post(
  "/:courseId/modules",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.addModule
);

/**
 * @route PATCH /api/v1/courses/:courseId/modules/:moduleId
 * @desc Update a module
 * @access Private (requires JWT, admin role)
 */
router.patch(
  "/:courseId/modules/:moduleId",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.updateModule
);

/**
 * @route DELETE /api/v1/courses/:courseId/modules/:moduleId
 * @desc Delete a module
 * @access Private (requires JWT, admin role)
 */
router.delete(
  "/:courseId/modules/:moduleId",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.deleteModule
);

/**
 * @route POST /api/v1/courses/:courseId/modules/:moduleId/lectures
 * @desc Add a new lecture to a module
 * @access Private (requires JWT, admin role)
 */
router.post(
  "/:courseId/modules/:moduleId/lectures",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.addLecture
);

/**
 * @route PATCH /api/v1/courses/:courseId/modules/:moduleId/lectures/:lectureId
 * @desc Update a lecture
 * @access Private (requires JWT, admin role)
 */
router.patch(
  "/:courseId/modules/:moduleId/lectures/:lectureId",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.updateLecture
);

/**
 * @route DELETE /api/v1/courses/:courseId/modules/:moduleId/lectures/:lectureId
 * @desc Delete a lecture
 * @access Private (requires JWT, admin role)
 */
router.delete(
  "/:courseId/modules/:moduleId/lectures/:lectureId",
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.deleteLecture
);

/**
 * @route GET /api/v1/courses/lectures
 * @desc Get all lectures with optional filters (courseId, moduleId, search)
 * @access Public
 */
router.get("/lectures", CourseController.getLectures);

/**
 * @route POST /api/v1/courses/:id/enroll
 * @desc Enroll in a course
 * @access Private (requires JWT)
 */
router.post("/:id/enroll", auth(), CourseController.enrollInCourse);

/**
 * @route POST /api/v1/courses/:courseId/modules/:moduleId/lectures/:lectureId/complete
 * @desc Mark a lecture as complete
 * @access Private (requires JWT)
 */
router.post(
  "/:courseId/modules/:moduleId/lectures/:lectureId/complete",
  auth(),
  CourseController.markLectureComplete
);

export const CourseRoutes = router;
