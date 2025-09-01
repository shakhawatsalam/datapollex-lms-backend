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
