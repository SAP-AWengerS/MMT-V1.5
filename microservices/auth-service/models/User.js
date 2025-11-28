const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: false }, // Not required - generated for email users
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String }, // For email/password authentication
  createdAt: { type: Date, default: () => new Date() },
  isSubscribed: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  // Passkey/WebAuthn fields
  passkeys: [{
    credentialID: { type: Buffer },
    credentialPublicKey: { type: Buffer },
    counter: { type: Number },
    transports: [{ type: String }],
    createdAt: { type: Date, default: () => new Date() }
  }],
  currentChallenge: { type: String }
});

// Hash password before saving (only if password is modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
