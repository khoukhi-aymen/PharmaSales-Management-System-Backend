// scripts/createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/Schémas/User");

// Fonction utilitaire qui retourne une Promise pour hacher le mot de passe
function hashPassword(plainPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(plainPassword, salt, (err2, hashed) => {
        if (err2) return reject(err2);
        resolve(hashed);
      });
    });
  });
}

// Valeurs à personnaliser
const ADMIN_EMAIL = "admin@example.com";       // <- change ici
const ADMIN_PLAINTEXT = "MotDePasse123!";     // <- change ici

// Connexion à MongoDB (avec promesse)
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Vérifier si l'utilisateur existe déjà
    return User.findOne({ email: ADMIN_EMAIL }).exec();
  })
  .then((existingUser) => {
    if (existingUser) {
      console.log("Utilisateur déjà existant :", ADMIN_EMAIL);
      // fermer la connexion proprement
      return mongoose.disconnect().then(() => process.exit(0));
    }

    // Hacher le mot de passe -> retourne une Promise
    return hashPassword(ADMIN_PLAINTEXT);
  })
  .then((hashedPassword) => {
    if (!hashedPassword) return; // cas où on a déjà quitté (existing user)

    // Créer le document User
    const newUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    return newUser.save();
  })
  .then((savedUser) => {
    if (savedUser) {
      console.log("Admin créé avec succès :", savedUser.email);
    }
    return mongoose.disconnect();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erreur lors de la création de l'admin :", err);
    // s'assurer de fermer la connexion en cas d'erreur
    mongoose.disconnect().finally(() => process.exit(1));
  });
