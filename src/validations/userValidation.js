// src/validations/userValidation.js
import Joi from "joi";

export const registerSchema = Joi.object({
  userName: Joi.string().trim().required().min(3).max(30).message({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),
  email: Joi.string().trim().required().email().message({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
    .message({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  mobileNo: Joi.string().required().message({
    "string.empty": "Mobile number is required",
  }),
  role: Joi.string().valid("Admin", "User", "Provider").default("User"),
});

export const loginSchema = Joi.object({
  userName: Joi.string().required().message({
    "string.empty": "Username is required",
  }),
  password: Joi.string().required().message({
    "string.empty": "Password is required",
  }),
});

export const profileUpdateSchema = Joi.object({
  profileSettings: Joi.object({
    public: Joi.boolean().default(false),
    sharedInfo: Joi.array().items(Joi.string()),
  }),
  mobileNo: Joi.string(),
  profilePhoto: Joi.string(),
});

export const consentSchema = Joi.object({
  consent: Joi.boolean().required().message({
    "any.required": "Consent value is required",
  }),
});

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    next();
  };
};
