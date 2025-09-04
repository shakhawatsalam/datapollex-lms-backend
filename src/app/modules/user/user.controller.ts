import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";

import { IGenericResponse } from "../../../interfaces/common";
import config from "../../../config";

import { IUserResponse } from "./user.interface";
import ApiError from "../../../errors/Apierror";
import { UserService } from "./user.service";

export class UserController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    const user = await UserService.register({ name, email, password, role });
    res.status(httpStatus.CREATED).json({
      success: true,
      data: user,
      meta: {},
    } as IGenericResponse<IUserResponse>);
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await UserService.login({
      email,
      password,
    });

    res.cookie("refreshToken", refreshToken, {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: { user, accessToken },
      meta: {},
    } as IGenericResponse<{ user: IUserResponse; accessToken: string }>);
  });

  static logout = catchAsync(async (req: Request, res: Response) => {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: "strict",
    });

    const result = await UserService.logout();

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
      meta: {},
      message: "Logged out successfully",
    } as IGenericResponse<{ message: string }>);
  });

  static refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    const result = await UserService.refreshToken(refreshToken);
    res.status(httpStatus.OK).json({
      success: true,
      data: result,
      meta: {},
    } as IGenericResponse<{ accessToken: string }>);
  });

  static changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }
    await UserService.changePassword(user, { oldPassword, newPassword });
    res.status(httpStatus.OK).json({
      success: true,
      data: null,
      meta: {},
      message: "Password changed successfully",
    } as IGenericResponse<null>);
  });

  static getProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }
    const user = await UserService.getProfile(userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: user,
      meta: {},
    } as IGenericResponse<IUserResponse>);
  });
}
