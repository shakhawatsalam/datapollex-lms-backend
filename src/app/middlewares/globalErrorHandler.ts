import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { MongoError } from "mongodb";
import jwt from "jsonwebtoken";
import { IGenericErrorResponse } from "../../interfaces/common";
import handleValidationError from "../../errors/handleValidationError";
import handleCastError from "../../errors/handleCastError";
import ApiError from "../../errors/Apierror";

interface IErrorResponse {
  success: boolean;
  message: string;
  errorMessages: IGenericErrorResponse["errorMessages"];
  stack?: string;
}

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction // Explicitly include next
) => {
  // Log error for debugging
  console.error("Error:", {
    message: err?.message,
    stack: err?.stack,
    path: req?.path,
    method: req?.method,
  });

  let statusCode = 500;
  let message = "Internal Server Error";
  let errorMessages: IGenericErrorResponse["errorMessages"] = [];

  // Handle Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // Handle Mongoose Cast Error
  else if (err instanceof mongoose.Error.CastError) {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // Handle MongoDB Duplicate Key Error
  else if (err instanceof MongoError && err.code === 11000) {
    statusCode = 400;
    message = "Duplicate Key Error";
    const keyValue = (err as any).keyValue as
      | Record<string, unknown>
      | undefined;
    const field = keyValue ? Object.keys(keyValue)[0] : undefined;
    errorMessages = field
      ? {
          field,
          value: keyValue![field],
          message: `${field} already exists`,
        }
      : {
          message:
            "Duplicate key error occurred, but field could not be identified",
        };
  }
  // Handle JWT Errors
  else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid Token";
    errorMessages = { message: "The provided token is invalid" };
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Token Expired";
    errorMessages = { message: "The token has expired, please log in again" };
  }
  // Handle Custom ApiError
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = err.message ? [{ path: "", message: err.message }] : [];
  }
  // Handle Generic Errors
  else if (err instanceof Error) {
    message = err.message || "Something went wrong";
    errorMessages = err.message ? [{ path: "", message: err.message }] : [];
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
  } as IErrorResponse);

  // Call next() to ensure the middleware chain continues (optional, but good practice)
  next();
};

export default globalErrorHandler;
