import httpStatus from "http-status";
import { IUserResponse, IUserCourse } from "../user/user.interface";
import CourseModel from "./course.model";
import UserModel from "../user/user.model";
import { ICourse } from "./course.interface";
import ApiError from "../../../errors/Apierror";

interface CreateCourseInput {
  title: string;
  description: string;
  price: number;
  thumbnail: { public_id: string; url: string };
  modules: Array<{
    title: string;
    moduleNumber: number;
    lectures: Array<{
      title: string;
      videoUrl: string;
      pdfNotes: Array<{ public_id: string; url: string }>;
    }>;
  }>;
}

interface UpdateCourseInput {
  title?: string;
  description?: string;
  price?: number;
  thumbnail?: { public_id: string; url: string };
  modules?: Array<{
    title?: string;
    moduleNumber?: number;
    lectures?: Array<{
      title?: string;
      videoUrl?: string;
      pdfNotes?: Array<{ public_id: string; url: string }>;
    }>;
  }>;
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CreateCourseInput): Promise<ICourse> {
    const course = await CourseModel.create(data);
    return course.toObject() as ICourse;
  }

  /**
   * Get all courses
   */
  static async getAllCourses(): Promise<ICourse[]> {
    const courses = await CourseModel.find();
    return courses.map((course) => course.toObject() as ICourse);
  }

  /**
   * Get a single course by ID
   */
  static async getCourseById(id: string): Promise<ICourse> {
    const course = await CourseModel.findById(id);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    return course.toObject() as ICourse;
  }

  /**
   * Update a course
   */
  static async updateCourse(
    id: string,
    data: UpdateCourseInput
  ): Promise<ICourse> {
    const course = await CourseModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    return course.toObject() as ICourse;
  }

  /**
   * Delete a course
   */
  static async deleteCourse(id: string): Promise<void> {
    const course = await CourseModel.findByIdAndDelete(id);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    // Remove course from all users' courses array
    await UserModel.updateMany(
      { "courses.courseId": id },
      { $pull: { courses: { courseId: id } } }
    );
  }

  /**
   * Enroll a user in a course
   */
  static async enrollInCourse(
    courseId: string,
    userId: string
  ): Promise<IUserResponse> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const isEnrolled = user.courses.some((c) => c.courseId === courseId);
    if (isEnrolled) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User already enrolled in this course"
      );
    }
    user.courses.push({
      courseId,
      completedLectures: [],
      progress: 0,
    } as IUserCourse);
    await user.save();
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }

  /**
   * Mark a lecture as complete
   */
  static async markLectureComplete(
    courseId: string,
    moduleId: string,
    lectureId: string,
    userId: string
  ): Promise<IUserResponse> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = course.modules.find((m) => m._id.toString() === moduleId);
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    const lecture = module.lectures.find((l) => l._id.toString() === lectureId);
    if (!lecture) {
      throw new ApiError(httpStatus.NOT_FOUND, "Lecture not found");
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    const userCourse = user.courses.find((c) => c.courseId === courseId);
    if (!userCourse) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User not enrolled in this course"
      );
    }
    if (!userCourse.completedLectures.includes(lectureId)) {
      userCourse.completedLectures.push(lectureId);
      // Calculate progress (percentage of completed lectures)
      const totalLectures = course.modules.reduce(
        (sum, m) => sum + m.lectures.length,
        0
      );
      userCourse.progress =
        (userCourse.completedLectures.length / totalLectures) * 100;
      await user.save();
    }
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }
}
