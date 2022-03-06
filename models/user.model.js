const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  id:{
    type: String,
    required :true,
  },
  email: {
    type : String,
    required : true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  parties: [
    {
      party_id: {
        type: String,
      },
      name: {
        type: String,
      },
      number_of_people: {
        type: Number,
      },
      role:{
        type: String
      },
    }
  ]
});

const User = mongoose.model('Users', userSchema);

module.exports = User;