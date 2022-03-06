const router = require("express").Router();
const uuid = require("uuid");
const auth = require("../helpers/jwt");

let partySchema = require("../models/party.model");
let userSchema = require("../models/user.model");

router.route("/delete/:id").delete(async (req, res) => {
  const id = req.params["id"];
  try {
    const validate = auth.authenticateToken(req, res);
    if (validate) {
      await userSchema.updateOne(
        {
          id: validate.data.id,
          "parties.party_id": id,
        },
        {
          $pull: {
            parties: { party_id: id },
          },
        }
      );

      const party = await partySchema.findOne({id: id})

      for(let i = 0; i < party.peopls.length; i++){
        await userSchema.updateOne(
          {
            id: party.peopls[i].user_id,
            "parties.party_id": id,
          },
          {
            $pull: {
              parties: { party_id: id },
            },
          }
        );
      }
      
      await userSchema.updateOne(
        {
          "parties.party_id": id,
        },
        {
          $pull: {
            parties: { party_id: id },
          },
        }
      )

      await partySchema.findOneAndDelete({ id: id }, async (err, data) => {
        if (err) {
          return res
            .status(400)
            .json({ message: "การลบปาร์ตี้ผิดพลาด", status: "error" });
        } else {
          return res.status(200).json(data);
        }
      });
    } else {
      res.status(401).json({
        message: "UnauthorizedError",
        error: "Unauthorization",
        status: "error",
      });
    }
  } catch (err) {
    console.log(err);
  }
});

router.route("/update/:id").patch(async (req, res) => {
  const name = req.body.name;
  const number_of_people = req.body.number_of_people;
  const id = req.params["id"];

  try {
    const validate = auth.authenticateToken(req, res);

    if (validate) {
      await partySchema.findOneAndUpdate(
        { id: id },
        {
          $set: {
            name: name,
            number_of_people: number_of_people,
          },
        },
        {
          returnOriginal: false,
          returnNewDocument: true,
        },
        (err, data) => {
          if (err) {
            return res
              .status(400)
              .json({ message: "การแก้ไขผิดพลาด", status: "error" });
          } else {
            try {
              userSchema.updateOne(
                { id: validate.data.id, "parties.party_id": data.id },
                { $set: { "parties.$.name": data.name } },
                async (err) => {
                  if (err) {
                    return res
                      .status(400)
                      .json({ message: "การแก้ไขผิดพลาด", status: "error" });
                  } else {
                    if (data.peopls.length > number_of_people) {
                      let result = data.peopls;
                      let popped = [];
                      for (
                        let i = 0;
                        i < data.peopls.length - number_of_people + 1;
                        i++
                      ) {
                        popped.push(result.pop());
                      }
                      for (let j = 0; j < popped.length; j++) {
                        await userSchema.updateOne(
                          {
                            id: popped[j].user_id,
                            "parties.party_id": data.id,
                          },
                          {
                            $pull: {
                              parties: { party_id: data.id },
                            },
                          }
                        );
                      }

                      partySchema.updateOne(
                        { id: data.id },
                        { $set: { peopls: result } },
                        (err) => {
                          if (err) {
                            return res.status(400).json({
                              message: "การแก้ไขผิดพลาด",
                              status: "error",
                            });
                          } else {
                            return res.status(200).json(data);
                          }
                        }
                      );
                    } else {
                      try {
                        const party = await partySchema.findOne({
                          id: data.id,
                        });
                        for (let i = 0; i < party.peopls.length; i++) {
                          await userSchema.updateOne(
                            {
                              id: party.peopls[i].user_id,
                              "parties.party_id": data.id,
                            },
                            { $set: { "parties.$.name": data.name } }
                          );
                        }

                        return res.status(200).json(data);
                      } catch (err) {
                        console.log(err);
                      }
                    }
                  }
                }
              );
            } catch (err) {
              console.log(err);
            }
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
  } catch (err) {}
});

router.route("/create").post(async (req, res) => {
  const id = uuid.v4();
  const name = req.body.name;
  const number_of_people = req.body.number_of_people;
  try {
    const validate = auth.authenticateToken(req, res);

    if (validate) {
      const user = await userSchema.findOne({ id: validate.data.id });
      const partyObject = {
        id: id,
        name: name,
        number_of_people: number_of_people,
        create_by: [
          {
            id: validate.data.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
          },
        ],
      };
      partySchema.create(partyObject, (err, data) => {
        if (err) {
          res.status(400).json({
            message: "การสร้างปาร์ตี้ผิดพลาด",
            status: "error",
          });
        } else {
          userSchema.findOneAndUpdate(
            { id: user.id },
            {
              $push: {
                parties: {
                  party_id: data.id,
                  name: data.name,
                  number_of_people: data.number_of_people,
                  role: "owner",
                },
              },
            },
            (err) => {
              if (err) {
                return res.status(400).json({ error: err });
              } else {
                return res.status(200).json(data);
              }
            }
          );
        }
      });
    } else {
      res.status(401).json({
        message: "UnauthorizedError",
        error: "Unauthorization",
        status: "error",
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.route("/").get((req, res) => {
  partySchema
    .find()
    .then((render) => {
      res.json(render);
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/:id").get(async (req, res) => {
  const id = req.params["id"];

  try {
    const party = await partySchema.findOne({
      id: id,
    });

    if (party) {
      return res.status(200).json([party]);
    } else {
      return res
        .status(400)
        .json({ message: "ไม่มี ID ปาร์ตี้นี้", status: "error" });
    }
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

router.route("/join/:id").put(async (req, res) => {
  try {
    const validate = auth.authenticateToken(req, res);
    if (validate) {
      const user = await userSchema.findOne({ id: validate.data.id });
      const party = await partySchema.findOne({ id: req.params.id });
      const check_user = party.peopls.find(
        (i) => i.user_id === validate.data.id
      );

      const owner = party.create_by[0].email;

      if (validate.data.email == owner)
        return res.status(400).json({
          message: "คุณเป็นเจ้าของห้องไม่สามารถเข้าร่วมได้",
          status: "error",
        });

      if (check_user)
        return res
          .status(400)
          .json({ message: "คุณได้เข้าร่วมแล้ว", status: "error" });

      if (party.peopls.length < party.number_of_people) {
        partySchema.findOneAndUpdate(
          { id: req.params.id },
          {
            $push: {
              peopls: {
                user_id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
              },
            },
          },
          (err, data) => {
            if (err) {
              return res.status(400).json({ error: err });
            } else {
              userSchema.findOneAndUpdate(
                { id: user.id },
                {
                  $push: {
                    parties: {
                      party_id: data.id,
                      name: data.name,
                      number_of_people: data.number_of_people,
                      role: "join",
                    },
                  },
                },
                (err) => {
                  if (err) {
                    return res.status(400).json({ error: err });
                  } else {
                    // return res.status(200).json(data);
                    userSchema.findOneAndUpdate(
                      { email: data.create_by[0].email },
                      {
                        $push: {
                          peopls: {
                            user_id: user.id,
                            name: user.name,
                            lastname: user.lastname,
                            email: user.email,
                          },
                        },
                      },
                      (err) => {
                        if (err) {
                          return res.status(400).json({ error: err });
                        } else {
                          return res.status(200).json(data);
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      } else {
        return res
          .status(400)
          .json({ message: "ผู้เข้าร่วมเต็มแล้ว", status: "error" });
      }
    } else {
      res.status(401).json({
        message: "UnauthorizedError",
        error: "Unauthorization",
        status: "error",
      });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
