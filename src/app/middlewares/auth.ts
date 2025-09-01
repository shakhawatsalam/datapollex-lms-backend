import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import ApiError from "../../errors/Apierror";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";


/**
 * Middleware to authenticate requests using JWT and optional role-based access control
 * @param requireRoles Optional array of allowed roles (e.g., ['admin', 'user'])
 */
const auth =
  (...requireRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token (expect "Bearer <token>")
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "No token provided");
      }

      // Verify token
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt_secret as Secret
      );
      if (!verifiedUser.id || !verifiedUser.role) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token payload");
      }

      // Assign verified user to req.user
      req.user = { id: verifiedUser.id, role: verifiedUser.role };

      // Role-based access control
      if (requireRoles.length && !requireRoles.includes(verifiedUser.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Forbidden: Insufficient role"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
