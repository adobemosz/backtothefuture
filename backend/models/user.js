const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  telephoneNumber: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // ✅ Prevents unnecessary hashing
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // ✅ Ensures middleware completes properly
});

// ✅ Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d' // ✅ Uses 30 days if `JWT_EXPIRE` is missing
  });
};

// ✅ Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
