const express = require("express");
const router = express.Router();
const guardAuth = require("./auth.route");
const AchatController = require("../controllers/AchatController");


// Récupérer tous les achats du jour

router.get("/admin/Achats",guardAuth.isAuth,guardAuth.isAdmin,AchatController.getAchatsDuJour);

// POST → Ajouter un Achat fournisseur (route privée)

router.post("/admin/Achats/Ajouter", guardAuth.isAuth, AchatController.ajouterAchat);


// // GET PDF → récupérer le pdf de l'achat (route privée)


router.get("/admin/Achats/pdf/:id",AchatController.generatePdf );


// Modifier un achat fournisseur

router.put("/admin/Achats/Modifier/:id",guardAuth.isAuth,AchatController.modifierAchat);


// Supprimer un achat fournisseur

router.delete("/admin/Achats/Supprimer/:id",guardAuth.isAuth,AchatController.supprimerAchat);


// Modifier l'état d'un Achat

router.put("/admin/Achats/ModifierEtat/:id",guardAuth.isAuth,AchatController.modifierEtatAchat);


// GET les Achats filtrés par date → retourne tous les Achats filtrés par date (route privée)


router.get("/admin/Achats/FiltrerParDate",guardAuth.isAuth,AchatController.filtrerParDate);

module.exports = router;
