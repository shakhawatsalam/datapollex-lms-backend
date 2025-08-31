import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config/index";

let server: Server;

async function bootstrap() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("👋 Database Connection successful");
    server = app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    console.log("failed to connect", error);
  }
}

bootstrap();
