export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePic: { public_id: string; url: string };
  courses: IUserCourse[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IUserCourse {
  courseId: string;
  completedLectures: string[];
  progress: number;
  _id?: string;
}
