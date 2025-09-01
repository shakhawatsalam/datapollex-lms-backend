import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { CourseService } from "./course.service";
import { IGenericResponse } from "../../../interfaces/common";
import {  IUserResponse } from "../user/user.interface";
import { ICourse } from "./course.interface";
import ApiError from "../../../errors/Apierror";


export class CourseController {
  /**
   * Create a new course
   */
  static createCourse = catchAsync(async (req: Request, res: Response) => {
    const courseData = req.body;
    const course = await CourseService.createCourse(courseData);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: course,
      meta: {},
    } as IGenericResponse<ICourse>);
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
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Course ID is required");
    }
    const updateData = req.body;
    const course = await CourseService.updateCourse(id, updateData);
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
