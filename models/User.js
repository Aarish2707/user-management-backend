const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  });

  //code for hashing passwords
  userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();
    try{
        this.password = await bcrypt.hash(this.password,10);
        next();
    }
    catch(err){
        return next(err);
    }
  });

module.exports = mongoose.model("User", userSchema);
