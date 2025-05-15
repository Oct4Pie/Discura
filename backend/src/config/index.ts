import path from "path";

import dotenv from "dotenv";

// Load environment variables from project root first, then fallback to backend directory
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
// Also check the backend directory as fallback
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  // Database configuration
  database: {
    type: process.env.DB_TYPE || "sqlite",
    sqlite: {
      path:
        process.env.SQLITE_PATH ||
        path.join(process.cwd(), "data", "discura.db"),
      // WAL mode is enabled by default in the database service
    },
    // Future Turso configuration can be added here when needed
    turso: {
      url: process.env.TURSO_URL || "",
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    },
  },
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    callbackUrl:
      process.env.DISCORD_CALLBACK_URL ||
      "http://localhost:3001/auth/discord/callback",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export default config;
