import express from "express";
import type { Application, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";

// app
const app: Application = express();
const PORT = config.port || 3000;
// cors
app.use(cors({ credentials: true }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 👇 root route
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({ message: "Hello world ii ambeohao" });
});

export default app;
