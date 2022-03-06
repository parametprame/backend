const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const errors = require("./helpers/errorHandler");
const auth = require("./helpers/jwt");

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

const usersRouter = require("./routes/user.route");
const partyRouter = require("./routes/party.route");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// auth.authenticateToken.unless = unless;
// app.use(
//   auth.authenticateToken.unless({
//     path: [
//       { url: "/users/login", methods: ["POST"] },
//       { url: "/users/register", methods: ["POST"] }
//     ],
//   })
// );

app.use("/users", usersRouter);
app.use("/parties", partyRouter);
app.use(errors.errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
