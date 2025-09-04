import express from "express";
import auth from "../../middlewares/auth";

import { UserController } from "./user.controller";
import { ENUM_USER_ROLE } from "../../../enums/user";

const router = express.Router();

/**
 * @route POST /api/v1/users/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", UserController.register);

/**
 * @route POST /api/v1/users/login
 * @desc Log in a user and return JWT token
 * @access Public
 */
router.post("/login", UserController.login);

/**
 * @route POST /api/v1/users/logout
 * @desc Log out a user and clear refresh token cookie
 * @access Private (requires JWT, user or admin)
 */
router.post(
  "/logout",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  UserController.logout
);

/**
 * @route POST /api/v1/users/refresh-token
 * @desc Generate new access token using refresh token
 * @access Public
 */
router.post("/refresh-token", UserController.refreshToken);

/**
 * @route POST /api/v1/users/change-password
 * @desc Change user password
 * @access Private (requires JWT, user or admin)
 */
router.post(
  "/change-password",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  UserController.changePassword
);

/**
 * @route GET /api/v1/users/profile
 * @desc Get authenticated user's profile
 * @access Private (requires JWT, user or admin)
 */
router.get(
  "/profile",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  UserController.getProfile
);

export const UserRoutes = router;
