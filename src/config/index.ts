import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });


export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.ACCESS_TOKEN_PRIVATE_KEY,
  access_token: process.env.ACCESS_TOKEN,
  access_token_expire: process.env.ACCESS_TOKEN_EXPIRE,
  refresh_token: process.env.REFRESH_TOKEN,
  refresh_token_expire: process.env.REFRESH_TOKEN_EXPIRE,
};
