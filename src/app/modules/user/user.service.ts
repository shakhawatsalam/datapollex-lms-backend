import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { ILoginRequest, IUserResponse } from "./user.interface";
import UserModel from "./user.model";

import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import ApiError from "../../../errors/Apierror";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}

interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export class UserService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<IUserResponse> {
    const { name, email, password, role = "user" } = input;

    // Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
    }

    // Create user (password hashing is handled by pre-save hook)
    const user = await UserModel.create({
      name,
      email,
      password,
      role,
    });

    // Remove password from response
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  /**
   * Log in a user and return access/refresh tokens
   */
  static async login(input: ILoginRequest): Promise<{
    user: IUserResponse;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = input;

    // Find user
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // Remove password from response
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  /**
   * Log out a user - clear refresh token cookie
   */
  static async logout(): Promise<{ message: string }> {
    // Note: The actual logout logic (clearing cookies) is handled in the controller
    // This method can be extended to handle token blacklisting if needed
    return { message: "Logout successful" };
  }

  /**
   * Generate new access token using refresh token
   */
  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    if (!token) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Refresh token is required");
    }

    // Verify refresh token
    const verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt_refresh_secret as string
    );
    const { id: userId, role } = verifiedToken;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
    }

    // Generate new access token
    const accessToken = user.SignAccessToken();

    return { accessToken };
  }

  /**
   * Change user password
   */
  static async changePassword(
    user: JwtPayload | null,
    input: ChangePasswordInput
  ): Promise<void> {
    const { oldPassword, newPassword } = input;

    if (!user?.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    // Find user
    const existingUser = await UserModel.findById(user.id).select("+password");
    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
    }

    // Verify old password
    const isPasswordValid = await existingUser.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
    }

    // Update password (hashing is handled by pre-save hook)
    existingUser.password = newPassword;
    await existingUser.save();
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<IUserResponse> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Remove password from response
    const userWithoutPassword = user.toObject() as IUserResponse;
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }
}
