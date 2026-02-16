const Stock = require("./Schémas/Stock");

// Récupérer tous les produits de la date actuel
exports.getAll = () => {
  return new Promise((resolve, reject) => {

    // Début et fin de la journée
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    Stock.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ createdAt: -1 })
      .then((data) => resolve(data))
      .catch(() => reject("Erreur lors de la récupération du stock"));
  });
};





// Ajouter un produit

exports.ajouterProduit = ({ produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur }) => {
  return new Promise((resolve, reject) => {
    // Vérification des champs obligatoires
    if (!produit  || !quantite || !prixUnitaire || !dateEntree || !dateExpiration || !fournisseur) {
      return reject("Tous les champs sont requis");
    }

    // Création de l'objet
    const nouveauProduit = new Stock({
      produit,
      quantite,
      prixUnitaire,
      dateEntree,
      dateExpiration,
      fournisseur,
    });

    // Sauvegarde en base
    nouveauProduit.save()
      .then(() => resolve("Produit ajouté avec succès"))
      .catch((err) => reject("Erreur lors de l'ajout du produit"));
  });
};


// Modifier un produit

exports.modifierProduit = (id, { produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur }) => {
  return new Promise((resolve, reject) => {
    // Vérification des champs obligatoires
    if (!produit || !quantite || prixUnitaire == null || !dateEntree || !dateExpiration || !fournisseur) {
      return reject("Tous les champs sont requis");
    }

    Stock.findByIdAndUpdate(
      id,
      { produit, quantite, prixUnitaire, dateEntree, dateExpiration, fournisseur },
      { new: true, runValidators: true }
    )
      .then((updatedStock) => {
        if (!updatedStock) return reject("Produit non trouvé");
        resolve(`Produit "${updatedStock.produit}" mis à jour avec succès`);
      })
      .catch((err) => reject("Erreur lors de la mise à jour du produit"));
  });
};





// Supprimer un produit
exports.supprimerProduit = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject("ID du produit manquant");
    }

    Stock.findByIdAndDelete(id)
      .then((result) => {
        if (!result) {
          return reject("Produit introuvable ou déjà supprimé");
        }

        resolve("Produit supprimé avec succès");
      })
      .catch(() => {
        reject("Erreur lors de la suppression du produit");
      });
  });
};


// Récupérer tous les produits par date

exports.filtrerParDate = (dateDebut, dateFin) => {
  return new Promise((resolve, reject) => {
    if (!dateDebut || !dateFin) return reject("Les deux dates sont requises");

    Stock.find({
      dateEntree: { 
        $gte: new Date(dateDebut),  // dateDebut incluse
        $lte: new Date(dateFin)     // dateFin incluse
      }
    })
      .then((stocks) => resolve(stocks))
      .catch((err) => reject("Erreur lors du filtrage par date d'entrée."));
  });
};



