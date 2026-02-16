const StockModel = require("../models/StockModel");


// Récupérer tous les produits de la date actuel
exports.getAllStock = (req, res) => {
  StockModel.getAll()
    .then((data) => {
      return res.json({ data });
    })
    .catch((err) => {
      return res.status(500).json({ message: err });
    });
};


// Ajouter un produit

exports.ajouterProduit = (req, res) => {
  const { produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur } = req.body;

  // Appel du modèle
  StockModel.ajouterProduit({ produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur })
    .then((message) => {
      return res.json({ message });
    })
    .catch((err) => {
      return res.status(400).json({ message: err });
    });
};


// Modifier un produit

exports.modifierProduit = (req, res) => {
  const { id } = req.params;
  const { produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur } = req.body;

  StockModel.modifierProduit(id, { produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur })
    .then((message) => {
      return res.json({ message });
    })
    .catch((err) => {
      return res.status(400).json({ message: err });
    });
};




// Supprimer un produit
exports.supprimerProduit = (req, res) => {
  const { id } = req.params;

  StockModel.supprimerProduit(id)
    .then((message) => {
      return res.json({ message });
    })
    .catch((err) => {
      return res.status(400).json({ message: err });
    });
};


// Récupérer tous les produits par date

exports.filtrerParDate = (req, res) => {
  const { dateDebut, dateFin } = req.query;

  StockModel.filtrerParDate(dateDebut, dateFin)
    .then((data) => res.json({ data }))
    .catch((err) => res.status(400).json({ message: err }));
};


