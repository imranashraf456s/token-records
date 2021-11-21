const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "User_1",
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: [true, "Already exist email. Try with new email"],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "There must be a password"],
    minlength: [5, "password must contain atleast 5 characters length"],
    select: false, //                                         //Never Shown in output, For security
  },
  userDevices: [String],
  userTokens: [
    {
      token: String,
      expiry: {
        type: Date,
        default: Date.now() + 4 * 60000,
      },
    },
  ],
});

userSchema.methods.correctPassword = async function (userPassword, dbPassword) {
  if (userPassword === dbPassword) {
    return true;
  }
  return false;
};

userSchema.methods.removeExpireTokens = function (index) {
  console.log(
    "removeExpireTokens: " + this.userTokens[index].expiry + "\n" + new Date()
  );
  console.log(this.userTokens[index].expiry < new Date());
  if (this.userTokens[index].expiry < new Date())
    return this.userTokens.splice(index, 1);
};

userSchema.methods.updateTokenExpiry = function (index) {
  return (this.userTokens[index].expiry = Date.now() + 4 * 60000);
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
