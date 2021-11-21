require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;

mongoose
  .connect("mongodb://localhost:27017/gordian_exercise")
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log("DB error");
  });

app.listen(port, () => {
  console.log(`Server Connect at port: ${port}`);
});
