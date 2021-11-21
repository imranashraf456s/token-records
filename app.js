const express = require("express");
const app = express();
const morgan = require("morgan");
const authentication = require("./controller/authentication");
const errorController = require("./controller/errorController");
const AppError = require("./utils/appError");

app.use(express.json());
app.use(morgan("dev"));

app.post("/signup", authentication.signup);
app.post("/login", authentication.login);
app.get(
  "/protectedRoute",
  authentication.protectedRoute,
  authentication.welcome
);
app.all("*", (req, res, next) => {
  next(new AppError(`required path "${req.originalUrl}" not found`, 400));
});

app.use(errorController);

module.exports = app;
