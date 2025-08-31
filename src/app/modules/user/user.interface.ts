import { Document } from "mongoose";

// user interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profilePic: {
    public_id: string;
    url: string;
  };
  role: string;
  //   isVerified: boolean;
  // In IUser interface
  courses: Array<{
    courseId: string;
    completedLectures: string[]; // Array of lecture IDs marked as complete
    progress?: number; // Optional: Calculated percentage (e.g., completed / total lectures)
  }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

// registration user
export interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  profilePic?: { public_id: string; url: string };
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export interface IUpdateProfilePicture {
  profilePic?: { public_id: string; url: string };
}
