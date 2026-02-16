const express = require("express");
const router = express.Router();
const guardAuth = require("./auth.route");
const ProformaController = require("../controllers/ProformaController");


// GET stock → retourne tous les produits du Stock
router.get("/admin/Products", guardAuth.isAuth, guardAuth.isAdmin, ProformaController.getAllProducts);

// Route privée pour récupérer toutes les proformas du jour
router.get("/admin/Proformas", guardAuth.isAuth, guardAuth.isAdmin, ProformaController.getAllProformas);

// POST proforma → ajouter une proforma (route privée)
router.post("/admin/Proformats/Ajouter",guardAuth.isAuth, ProformaController.ajouterProforma);

// GET PDF → récupérer le pdf de la proforma (route privée)
router.get("/admin/Proformas/pdf/:id", ProformaController.generatePdf);


// Modifier une proforma (route privée)
router.put("/admin/Proformats/Modifier/:id", guardAuth.isAuth, ProformaController.modifierProforma);


// DELETE facture proforma → supprimer une facture (route privée)
router.delete("/admin/Proforma/Supprimer/:id",guardAuth.isAuth, ProformaController.supprimerProforma);


// GET Proforma By date → retourne tous les Factures par date (route privée)
router.get("/admin/Proformats/FiltrerParDate", guardAuth.isAuth, ProformaController.filtrerParDate);


module.exports = router;
