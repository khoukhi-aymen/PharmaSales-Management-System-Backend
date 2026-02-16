const  AutModel  = require("../models/AuthModel");



/************************ login ***********************/

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (password.length < 6) {
    return res.status(400).json({ message: "Mot de passe trop court." });
  }

  AutModel.LoginUserModel(email, password)
    .then((user) => {
      req.session.userID = user._id;
      req.session.role = user.role;

      // console.log(req.session.userID)
      // console.log(req.session.role)

      // IMPORTANT : on sauvegarde la session AVANT de répondre
      req.session.save(() => {
        res.json({
          message: "Connexion réussie.",
          redirectUrl: "/admin/Stock",
        });
      });
    })
    .catch(() => {
      return res.status(400).json({ message: "Erreur de connexion." });
    });
};




/************************ Lougout ***********************/

exports.Logout = (req, res, next) => {

  delete req.session.userID;
  delete req.session.role;
  res.clearCookie("connect.sid"); // Nettoie le cookie de session
  return res.json({ message: "Déconnexion réussie.", redirectUrl: "/login" });
};



