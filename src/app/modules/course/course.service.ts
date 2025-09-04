import { Document, Types } from "mongoose";
import httpStatus from "http-status";
import {
  
  IUserResponse,
  IUserCourse,
} from "../user/user.interface";
import CourseModel from "./course.model";
import UserModel from "../user/user.model";
import { ICourse, ILecture, IModule } from "./course.interface";
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

interface AddModuleInput {
  title: string;
  moduleNumber: number;
  lectures?: Array<{
    title: string;
    videoUrl: string;
    pdfNotes: Array<{ public_id: string; url: string }>;
  }>;
}

interface UpdateModuleInput {
  title?: string;
  moduleNumber?: number;
}

interface AddLectureInput {
  title: string;
  videoUrl: string;
  pdfNotes: Array<{ public_id: string; url: string }>;
}

interface UpdateLectureInput {
  title?: string;
  videoUrl?: string;
  pdfNotes?: Array<{ public_id: string; url: string }>;
}

interface LectureFilter {
  courseId?: string;
  moduleId?: string;
  search?: string;
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
    await UserModel.updateMany(
      { "courses.courseId": id },
      { $pull: { courses: { courseId: id } } }
    );
  }

  /**
   * Add a new module to a course
   */
  static async addModule(
    courseId: string,
    data: AddModuleInput
  ): Promise<IModule> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    // Ensure unique moduleNumber
    const maxModuleNumber = course.modules.reduce(
      (max, m) => Math.max(m.moduleNumber, max),
      0
    );
    if (data.moduleNumber <= maxModuleNumber) {
      data.moduleNumber = maxModuleNumber + 1;
    }
    (course.modules as Types.DocumentArray<IModule>).push(data as any);
    await course.save();
    const newModule = course.modules[
      course.modules.length - 1
    ] as Types.Subdocument<Types.ObjectId> & IModule;
    if (!newModule) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to add module"
      );
    }
    return newModule.toObject() as IModule;
  }

  /**
   * Update a module
   */
  static async updateModule(
    courseId: string,
    moduleId: string,
    data: UpdateModuleInput
  ): Promise<IModule> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    Object.assign(module, data);
    await course.save();
    return module.toObject() as IModule;
  }

  /**
   * Delete a module
   */
  static async deleteModule(courseId: string, moduleId: string): Promise<void> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    (course.modules as Types.DocumentArray<IModule>).pull(moduleId);
    // Remove associated lecture IDs from users' completedLectures
    const lectureIds = module.lectures.map((l) => l._id.toString());
    await UserModel.updateMany(
      { "courses.completedLectures": { $in: lectureIds } },
      { $pull: { "courses.$[].completedLectures": { $in: lectureIds } } }
    );
    await course.save();
  }

  /**
   * Add a new lecture to a module
   */
  static async addLecture(
    courseId: string,
    moduleId: string,
    data: AddLectureInput
  ): Promise<ILecture> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    (module.lectures as Types.DocumentArray<ILecture>).push(data as any);
    await course.save();
    const newLecture = module.lectures[
      module.lectures.length - 1
    ] as Types.Subdocument<Types.ObjectId> & ILecture;
    if (!newLecture) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to add lecture"
      );
    }
    return newLecture.toObject() as ILecture;
  }

  /**
   * Update a lecture
   */
  static async updateLecture(
    courseId: string,
    moduleId: string,
    lectureId: string,
    data: UpdateLectureInput
  ): Promise<ILecture> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    const lecture = (module.lectures as Types.DocumentArray<ILecture>).id(
      lectureId
    );
    if (!lecture) {
      throw new ApiError(httpStatus.NOT_FOUND, "Lecture not found");
    }
    Object.assign(lecture, data);
    await course.save();
    return lecture.toObject() as ILecture;
  }

  /**
   * Delete a lecture
   */
  static async deleteLecture(
    courseId: string,
    moduleId: string,
    lectureId: string
  ): Promise<void> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    const lecture = (module.lectures as Types.DocumentArray<ILecture>).id(
      lectureId
    );
    if (!lecture) {
      throw new ApiError(httpStatus.NOT_FOUND, "Lecture not found");
    }
    (module.lectures as Types.DocumentArray<ILecture>).pull(lectureId);
    await UserModel.updateMany(
      { "courses.completedLectures": lectureId },
      { $pull: { "courses.$[].completedLectures": lectureId } }
    );
    await course.save();
  }

  /**
   * Get all lectures with optional filters
   */
  static async getLectures(filter: LectureFilter): Promise<ILecture[]> {
    const { courseId, moduleId, search } = filter;
    const query: any = {};
    if (courseId) {
      query._id = courseId;
    }
    const courses = await CourseModel.find(query);
    const lectures: ILecture[] = [];
    courses.forEach((course) => {
      (course.modules as Types.DocumentArray<IModule>).forEach((module) => {
        if (!moduleId || module._id.toString() === moduleId) {
          (module.lectures as Types.DocumentArray<ILecture>).forEach(
            (lecture) => {
              if (
                !search ||
                lecture.title.toLowerCase().includes(search.toLowerCase())
              ) {
                lectures.push(lecture.toObject() as ILecture);
              }
            }
          );
        }
      });
    });
    return lectures;
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
    const module = (course.modules as Types.DocumentArray<IModule>).id(
      moduleId
    );
    if (!module) {
      throw new ApiError(httpStatus.NOT_FOUND, "Module not found");
    }
    const lecture = (module.lectures as Types.DocumentArray<ILecture>).id(
      lectureId
    );
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
    // Enforce sequential unlocking
    const allLectures: { moduleId: string; lectureId: string }[] = [];
    (course.modules as Types.DocumentArray<IModule>).forEach((m) => {
      (m.lectures as Types.DocumentArray<ILecture>).forEach((l) => {
        allLectures.push({
          moduleId: m._id.toString(),
          lectureId: l._id.toString(),
        });
      });
    });
    const currentIndex = allLectures.findIndex(
      (l) => l.lectureId === lectureId
    );
    if (currentIndex > 0) {
      const previousLecture = allLectures[currentIndex - 1];
      if (
        !previousLecture ||
        !userCourse.completedLectures.includes(previousLecture.lectureId)
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Previous lecture must be completed first"
        );
      }
    }
    if (!userCourse.completedLectures.includes(lectureId)) {
      userCourse.completedLectures.push(lectureId);
      const totalLectures = allLectures.length;
      userCourse.progress =
        (userCourse.completedLectures.length / totalLectures) * 100;
      await user.save();
    }
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }
}
