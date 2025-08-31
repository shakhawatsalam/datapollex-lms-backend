import { ZodError, z } from "zod";
import { IGenericErrorResponse } from "../interfaces/common";
import { IGenericErrorMessage } from "../interfaces/error";

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = error.issues.map(
    (issue: z.core.$ZodIssue) => {
      return {
        path: String(issue.path[issue.path.length - 1] ?? ""), // Convert to string, fallback to empty string
        message: issue.message,
      };
    }
  );
  const statusCode = 400;
  return {
    statusCode,
    message: "Validation Error",
    errorMessages: errors,
  };
};

export default handleZodError;
