const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // mot de passe haché
  role: { type: String, default: "admin" }, // ou "user"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
