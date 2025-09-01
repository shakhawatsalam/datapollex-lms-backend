import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import httpStatus from "http-status";
import ApiError from "../errors/Apierror";


/**
 * Interface for the expected JWT payload
 */
interface JwtUserPayload extends JwtPayload {
  id: string;
  role: string;
}

/**
 * Create a JWT token
 * @param payload Data to include in the token (e.g., { id: string, role: string })
 * @param secret JWT secret key
 * @param expiresIn Token expiration time (e.g., '1h', '7d')
 * @returns JWT token
 */
const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string | number
): string => {
  if (!secret) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "JWT secret is not defined"
    );
  }
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @param secret JWT secret key
 * @returns Decoded payload
 * @throws ApiError if token is invalid
 */
const verifyToken = (token: string, secret: Secret): JwtUserPayload => {
  try {
    if (!secret) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "JWT secret is not defined"
      );
    }
    return jwt.verify(token, secret) as JwtUserPayload;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
