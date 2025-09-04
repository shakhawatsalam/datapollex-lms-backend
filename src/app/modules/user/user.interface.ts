import { Document, Types } from "mongoose";


/**
 * Interface for a course in the user's courses array
 */
export interface IUserCourse {
  courseId: string;
  completedLectures: string[];
  progress?: number;
}

/**
 * Interface for User document
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profilePic: {
    public_id: string;
    url: string;
  };
  role: "user" | "admin";
  courses: IUserCourse[];
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

/**
 * Interface for user response (password is optional)
 */
export interface IUserResponse
  extends Omit<
    IUser,
    "password" | "comparePassword" | "SignAccessToken" | "SignRefreshToken"
  > {
  password?: string;
}

/**
 * Interface for user registration input
 */
export interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  profilePic?: { public_id: string; url: string };
}

/**
 * Interface for login request
 */
export interface ILoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for updating user information
 */
export interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

/**
 * Interface for updating profile picture
 */
export interface IUpdateProfilePicture {
  profilePic?: { public_id: string; url: string };
}
