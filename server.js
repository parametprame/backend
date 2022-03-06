const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const errors = require("./helpers/errorHandler");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const uri = process.env.ATLAS_URI;

mongoose.connect(uri, { useNewUrlParser: true }).then(
  () => {
    console.log("Database successfully connected");
  },
  (error) => {
    console.log("Could not connect to database: " + error);
  }
);

const usersRouter = require("./api/user.route");
const partyRouter = require("./api/party.route");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use("/api/users", usersRouter);
app.use("/api/parties", partyRouter);
app.use(errors.errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
