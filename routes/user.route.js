const router = require("express").Router();
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const auth = require("../helpers/jwt");

let userSchema = require("../models/user.model");
let partySchema = require("../models/party.model");

router.route("/register").post(async (req, res) => {
  const salt = bcrypt.genSaltSync(10);
  const id = uuid.v4();
  const email = req.body.email;
  const password = req.body.password;

  if (password.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  const encodePassword = bcrypt.hashSync(password, salt);

  try {
    const userObject = {
      id: id,
      email: email,
      password: encodePassword,
    };
    await userSchema.create(userObject, (err, data) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "อีเมลนี้มีผู้ใช้แล้ว", status: "error" });
      } else {
        return res.status(200).json(data);
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", message: "อีเมลนี้มีผู้ใช้แล้ว" });
    }
    throw error;
  }
});

router.route("/leave/:id").patch(async (req, res) => {
  const id = req.params["id"];


  try {
    const validate = auth.authenticateToken(req, res);
    if (validate) {
      await partySchema.findOneAndUpdate(
        { id: id, "peopls.user_id": validate.data.id },
        {
          $pull: {
            peopls: { user_id: validate.data.id },
          },
        }
      );

      await userSchema.findOneAndUpdate(
        { id: validate.data.id },
        {
          $pull: {
            parties: { party_id: id },
          },
        },
        (err, data) => {
          if(err){
            return res.json({ status: "error", message: "การออกจากปาร์ตี้ผิดพลาด" });

          }else{
            return res.status(200).json(data)
          }
        }
      );
    } else {
      res.status(401).json({
        message: "UnauthorizedError",
        error: "Unauthorization",
        status: "error",
      });
    }
  } catch {}
});

router.route("/login").post(async (req, res) => {
  const { email, password } = req.body;

  const user = await userSchema.findOne({ email });
  try {
    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "ไม่มีผู้ใช้งานนี้" });
    }

    if (await bcrypt.compareSync(password, user.password)) {
      const userData = {
        id: user.id,
        email: user.email,
      };

      const token = auth.generateAccessToken(userData);

      return res.json({ status: "ok", token: token, user: userData });
    } else {
      return res.json({ status: "error", message: "รหัสผ่านผิดพลาด" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.route("/profile").get(async (req, res) => {
  try {
    const validate = auth.authenticateToken(req, res);
    if (validate) {
      const user = await userSchema.findOne({ id: validate.data.id });
      return res.json(user);
    } else {
      return res.json({
        status: "error",
        message: "กรุณาลงซื้อเข้าใช้งานระบบ",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
