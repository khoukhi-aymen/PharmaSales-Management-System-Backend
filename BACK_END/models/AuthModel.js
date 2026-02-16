// models/modelUser.js
const User = require("./Schémas/User");
const bcrypt = require("bcryptjs");
const validator = require("validator");



exports.LoginUserModel = (email, password) => {
  return new Promise((resolve, reject) => {

    if (!email || !password) return reject("Email et mot de passe requis.");

    if (!validator.isEmail(email)) {return reject("Adresse email invalide.");}

    User.findOne({ email })
      .then((user) => {
        if (!user) return reject("Email ou mot de passe incorrect.");

        bcrypt.compare(password, user.password)
          .then(isMatch => {
            if (!isMatch) return reject("Email ou mot de passe incorrect.");
            resolve(user);
          });
      })
      .catch(() => reject("Erreur interne."));
  });
};

