const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const partySchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    number_of_people: {
      type: Number,
      required: true,
    },
    create_by: [
      {
        name: {
          type: String,
        },
        lastname: {
          type: String,
        },
        email: {
          type: String,
        },
      },
    ],
    peopls: [
      {
        user_id: {
          type: String,
        },
        name: {
          type: String,
        },
        lastname: {
          type: String,
        },
        email: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
  { _id: false }
);

const Party = mongoose.model("Parties", partySchema);

module.exports = Party;
