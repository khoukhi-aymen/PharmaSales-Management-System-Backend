// middlewares/authMiddleware.js

// Routes privées → utilisateur doit être connecté
exports.isAuth = (req, res, next) => {
  if (req.session.userID) {
    return next(); // Utilisateur connecté → accès autorisé
  }
  // Non connecté → React redirige vers /login
  return res.json({ redirectUrl: "/login" });
};



// Routes publiques → utilisateur déjà connecté ne peut pas accéder
exports.nonAuth = (req, res, next) => {
  if (req.session.userID) { // Déjà connecté → accès non autorisé vers /login direcetement donc redirection vers dashboard
    return res.json({ loggedIn: true, redirectUrl: "/admin/Stock" });
  }
  return res.json({ loggedIn: false});
};

//Check Role sécurisé
exports.isAdmin = (req, res, next) => {
  if (req.session.role !== "admin") {
    return res.status(403).json({ message: "Accès interdit." });
  }
  next();
};

