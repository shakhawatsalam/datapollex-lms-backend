import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../../../config";
import { IUser } from "./user.interface";

import httpStatus from "http-status";
import ApiError from "../../../errors/Apierror";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePic: {
      public_id: { type: String, default: "" },
      url: {
        type: String,
        default:
          "https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/man-user-circle-icon.png",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    courses: [
      {
        courseId: String,
        completedLectures: [String],
        progress: Number,
      },
    ],
  },
  { timestamps: true }
);

/**
 * Hash password before saving
 */
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Sign access token
 */
userSchema.methods.SignAccessToken = function () {
  if (!config.jwt_secret) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "JWT secret is not defined"
    );
  }
  return jwt.sign(
    { id: this._id.toString(), role: this.role },
    config.jwt_secret,
    { expiresIn: config.jwt_access_expires_in } as SignOptions
  );
};

/**
 * Sign refresh token
 */
userSchema.methods.SignRefreshToken = function () {
  if (!config.jwt_refresh_secret) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "JWT refresh secret is not defined"
    );
  }
  return jwt.sign(
    { id: this._id.toString(), role: this.role },
    config.jwt_refresh_secret,
    { expiresIn: config.jwt_refresh_expires_in } as SignOptions
  );
};

/**
 * Compare password
 */
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ "courses.courseId": 1 });

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
