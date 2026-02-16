const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const guardAuth = require("../routers/auth.route");



// Route pour vérifier session 
router.get("/login", guardAuth.nonAuth);


// Login (public) → accessible uniquement si non connecté
router.post("/login", AuthController.login);

// déconnexion(route privé) → dértruire la session et revenir vers /login
router.post("/logout", AuthController.Logout);



module.exports = router;
