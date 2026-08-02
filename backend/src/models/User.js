const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Remove sensitive passwordHash from output when JSON stringified
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  user.id = user._id.toString();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
