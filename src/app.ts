import express, { Application, Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";
import routes from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { IGenericResponse } from "./interfaces/common";

// Initialize Express app
const app: Application = express();

// Middleware
app.use(
  cors({
    origin: config.frontend_url || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api/v1", routes);

// Root Route
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(httpStatus.OK).json({
      success: true,
      data: { message: "Welcome to the LMS API" },
      meta: {},
    } as IGenericResponse<{ message: string }>);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
