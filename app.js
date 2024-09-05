const express = require("express");
const cors = require("cors");
const AppError = require("./utils/AppError");
const rateLimit = require("express-rate-limit");
//middleware
const errorHandler = require("./middlewares/errorHandler");

//routes
const authRoute = require("./routes/authRoutes");
const userRoute = require("./routes/userRoutes");

const app = express();

app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configure the cors
const app_url = process.env.APP_URL;
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 10,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "50mb", extended: true }));

//baseurl
const base = "/api/v1";
//routes
app.use(`${base}/auth`, authRoute);
app.use(`${base}/user`, userRoute);

app.use(errorHandler);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
