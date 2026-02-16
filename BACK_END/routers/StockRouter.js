const express = require("express");
const router = express.Router();
const guardAuth = require("./auth.route");
const StockController = require("../controllers/StockController");


// GET stock → retourne tous les produits de la date actuel (route privée)
router.get("/admin/Stock", guardAuth.isAuth, guardAuth.isAdmin, StockController.getAllStock);

// POST stock → ajouter un produit (route privée)
router.post("/admin/Stock/AjouterProduit", guardAuth.isAuth, StockController.ajouterProduit);

// Update stock → modifier un produit (route privée)
router.put("/admin/Stock/ModifierProduit/:id",guardAuth.isAuth, StockController.modifierProduit);

// DELETE stock → supprimer un produit (route privée)
router.delete("/admin/Stock/SupprimerProduit/:id", guardAuth.isAuth, StockController.supprimerProduit);

// GET Stock By date → retourne tous les produits par date (route privée)
router.get("/admin/Stock/FiltrerParDate", guardAuth.isAuth, StockController.filtrerParDate);


module.exports = router;
