import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "./user.interface";
import jwt from "jsonwebtoken";
import config from "../../../config";

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
      }, // Or a placeholder URL
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

// Hash Password before saving

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//  Sing access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, config.access_token as string, {
    expiresIn: "5m",
  });
};

//  Sign Refresh Token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, config.refresh_token as string, {
    expiresIn: "3d",
  });
};

//  compare password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ "courses.courseId": 1 });

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
