import express from "express";
import { CourseController } from "./course.controller";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../../enums/user";


const router = express.Router();

/**
 * @route POST /api/v1/courses
 * @desc Create a new course
 * @access Private (requires JWT, admin role)
 */
router.post("/", auth(ENUM_USER_ROLE.ADMIN), CourseController.createCourse);

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
 * @desc Update a course
 * @access Private (requires JWT, admin role)
 */
router.patch("/:id", auth(ENUM_USER_ROLE.ADMIN), CourseController.updateCourse);

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
 * @route GET /api/v1/lectures
 * @desc Get all lectures with optional course and module filters
 * @access Public
 */
router.get("/lectures", CourseController.getLectures);

/**
 * @route POST /api/v1/courses/:id/enroll
 * @desc Enroll in a course
 * @access Private (requires JWT, user or admin role)
 */
router.post(
  "/:id/enroll",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  CourseController.enrollInCourse
);

/**
 * @route POST /api/v1/courses/:courseId/modules/:moduleId/lectures/:lectureId/complete
 * @desc Mark a lecture as complete
 * @access Private (requires JWT, user or admin role)
 */
router.post(
  "/:courseId/modules/:moduleId/lectures/:lectureId/complete",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  CourseController.markLectureComplete
);

export const CourseRoutes = router;
