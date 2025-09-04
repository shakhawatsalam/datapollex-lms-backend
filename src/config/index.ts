import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

interface AppConfig {
  env: string;
  port: number;
  frontend_url: string | undefined;
  database_url: string | undefined;
  jwt_secret: string | undefined;
  jwt_refresh_secret: string | undefined;
  jwt_access_expires_in: string;
  jwt_refresh_expires_in: string;
  cloud_name: string;
  cloud_api_key: string;
  cloud_secret_key: string;
}

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  frontend_url: process.env.FRONTEND_URL,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  cloud_name: process.env.CLOUD_NAME,
  cloud_api_key: process.env.CLOUD_API_KEY,
  cloud_secret_key: process.env.CLOUD_SECRET_KEY,
} as AppConfig;
