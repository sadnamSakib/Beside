// src/config/env.js
import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import { fileURLToPath } from "url";

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Define validation schema for environment variables
const envSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("development", "production", "test")
      .required(),
    PORT: Joi.number().default(3000),
    MONGO_URI: Joi.string().required().description("MongoDB connection URI"),
    JWT_SECRET: Joi.string().required().min(32).description("JWT secret key"),
    JWT_EXPIRES_IN: Joi.string()
      .default("1d")
      .description("JWT expiration time"),
    JWT_COOKIE_EXPIRES_IN: Joi.number()
      .default(1)
      .description("JWT cookie expiration time in days"),
    ALLOWED_ORIGINS: Joi.string()
      .default("http://localhost:3000")
      .description("Comma-separated list of allowed origins for CORS"),
    LOG_LEVEL: Joi.string()
      .valid("error", "warn", "info", "http", "debug")
      .default("info"),
    // Email service configuration
    EMAIL_HOST: Joi.string().description("SMTP host"),
    EMAIL_PORT: Joi.number().description("SMTP port"),
    EMAIL_USERNAME: Joi.string().description("SMTP username"),
    EMAIL_PASSWORD: Joi.string().description("SMTP password"),
    EMAIL_FROM: Joi.string().description("Email from address"),
    FRONTEND_URL: Joi.string()
      .default("http://localhost:3000")
      .description("Frontend URL for email links"),
    // SendGrid specific configuration
    SENDGRID_USERNAME: Joi.string().description("SendGrid username"),
    SENDGRID_PASSWORD: Joi.string().description("SendGrid password/API key"),
  })
  .unknown();

// Validate environment variables
const { value: envVars, error } = envSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated environment configuration
export const env = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    cookieExpiresIn: envVars.JWT_COOKIE_EXPIRES_IN,
  },
  cors: {
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(","),
  },
  logging: {
    level: envVars.LOG_LEVEL,
  },
  email: {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    username: envVars.EMAIL_USERNAME,
    password: envVars.EMAIL_PASSWORD,
    from: envVars.EMAIL_FROM || "noreply@besideapp.com",
    frontendUrl: envVars.FRONTEND_URL,
    sendgrid: {
      username: envVars.SENDGRID_USERNAME,
      password: envVars.SENDGRID_PASSWORD,
    },
  },
};
