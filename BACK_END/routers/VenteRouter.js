const express = require("express");
const router = express.Router();
const guardAuth = require("./auth.route");
const VenteController = require("../controllers/VenteController");



// Route privée pour récupérer toutes les commandes clients du jour

router.get("/admin/Ventes", guardAuth.isAuth, guardAuth.isAdmin, VenteController.getAllVentes);

// Ajouter une commande client (vente) → route privée

router.post("/admin/Ventes/Ajouter", guardAuth.isAuth, VenteController.ajouterVente);

// Modifier une commande vente (route privée)

router.put("/admin/Ventes/Modifier/:id", guardAuth.isAuth, VenteController.modifierVente);

// DELETE → supprimer une commande client (vente)

router.delete("/admin/Ventes/Supprimer/:id",guardAuth.isAuth,VenteController.supprimerVente);


//Changer l'état d'une vente(route privée)

router.put("/admin/Ventes/ModifierEtat/:id", guardAuth.isAuth, VenteController.modifierEtatVente);


// GET PDF → récupérer le pdf de la BL ou Facture (route privée)

router.get("/admin/Ventes/pdf/:id", VenteController.generatePdf);


// GET Ventes by date → retourne toutes les ventes par date (route privée)

router.get("/admin/Ventes/FiltrerParDate", guardAuth.isAuth, VenteController.filtrerParDate);


module.exports = router;
