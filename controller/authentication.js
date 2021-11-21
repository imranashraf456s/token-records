const User = require("./../models/dbmodel");
const getMAC = require("getmac").default;
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const signJwt = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const cookieOptions = {
  expiresIn: Date(Date.now()) * process.env.COOKIE_EXPIRES * 24 * 3600 * 1000,
  httpOnly: true,
};

const sendJwt = (user, token, statusCode, res) => {
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const addMacAdress = async (user, email) => {
  const macAdress = getMAC();
  console.log(macAdress);
  const resultAdress = user.userDevices.indexOf(macAdress);
  if (resultAdress) {
    await User.findOneAndUpdate(
      { email: email },
      {
        $addToSet: {
          userDevices: macAdress,
        },
      }
    );
    console.log("New Device");
  } else {
    console.log("Device Exist");
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.json({ status: "Done" });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check Username Password
  if (!email || !password)
    return next(new AppError("No User or Password Entered", 404));

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.correctPassword(password, user.password)) {
    return next(new AppError("UserName or Password Incorrect", 404));
  }
  let length = user.userTokens.length - 1;

  while (length >= 0) {
    user.removeExpireTokens(length);
    await user.save();
    length--;
  }

  //Valid User
  //MAC Address entry
  addMacAdress(user, email);

  //Jwt Entry
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  await User.findOneAndUpdate(
    { email: email },
    {
      $push: {
        userTokens: {
          token,
        },
      },
    }
  );

  sendJwt(user, token, 200, res);
});

exports.protectedRoute = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];

  if (!token) return next(new AppError("Inavalid Token", 401));

  //console.log(token);

  //Verification of Token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const user = await User.findById(decodedToken.id);
  // const user = await User.find({
  //   "userTokens.token": { $eq: token },
  // });

  if (!user) return next(new AppError("Token Not Found", 401));

  const userOwnToken = user.userTokens.find((currElem) => {
    if (currElem.token === token) return currElem;
  });

  if (userOwnToken.expiry < new Date())
    return next(
      new AppError(
        "Sorry! Your Token Expired due to Inactivity. Please Login Again"
      )
    );

  const index = user.userTokens.indexOf(userOwnToken);
  user.updateTokenExpiry(index);
  await user.save();

  console.log(userOwnToken.expiry.toLocaleTimeString());

  next();
});

exports.welcome = (req, res) => {
  res.json({ "Message: ": "Welcome" });
};
