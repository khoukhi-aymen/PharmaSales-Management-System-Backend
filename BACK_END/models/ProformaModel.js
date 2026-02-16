const { Proforma, getNextInvoiceNumber } = require("./Schémas/Proforma");
const Stock = require("./Schémas/Stock");

// Récupérer tous les produits du Stock
exports.getAllProducts = () => {
  return new Promise((resolve, reject) => {
    Stock.find({})
      .sort({ createdAt: -1 })
      .then((data) => {
        resolve(data)
    })
      .catch(() => reject("Erreur lors de la récupération du stock"));
  });
};


// Ajouter une proforma avec numéro automatique

exports.ajouterProforma = ({ dateFacture, clientNom, produits, tva }) => {
  return new Promise((resolve, reject) => {
    // Vérifications
    if (!dateFacture || !clientNom) return reject("Tous les champs client sont requis");
    if (!Array.isArray(produits) || produits.length === 0) return reject("Veuillez ajouter au moins un produit");

    if (tva === undefined || tva < 0 || tva > 100) return reject("TVA invalide");

    // Génération du numéro automatique
    getNextInvoiceNumber()
      .then(numeroFacture => {
        const nouvelleProforma = new Proforma({
          numeroFacture,
          dateFacture: dateFacture ? new Date(dateFacture) : new Date(),
          clientNom,
          tva,
          produits
        });

        // Sauvegarde
        return nouvelleProforma.save()
          .then(() => resolve("Proforma ajoutée avec succès !"))
          .catch(() => reject("Erreur lors de l'ajout de la proforma"));
      })
      .catch(err => reject(err));
  });
};



// Récupérer toutes les proformas de la journée

exports.getAllProforma = () => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    Proforma.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ createdAt: -1 })
      .then(data => resolve(data))
      .catch(() => reject("Erreur lors de la récupération des proformas"));
  });
};



//récupérer la proforma par ID pour la génération PDF

exports.getProformaById = (id) => {
  return new Promise((resolve, reject) => {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return reject("ID invalide");
    }

    Proforma.findById(id)
      .then(proforma => {
        if (!proforma) return reject("Proforma introuvable");
        resolve(proforma);
      })
      .catch(err => {
        console.log("Erreur MongoDB:", err);
        reject("Erreur lors de la récupération de la proforma");
      });
  });
};


// Modifier une facture proform

exports.modifierProforma = (id, { dateFacture, clientNom, tva, produits }) => {
  return new Promise((resolve, reject) => {
    // Vérifications
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return reject("ID invalide");
    if (!dateFacture || !clientNom) return reject("Tous les champs client sont requis");
    if (!Array.isArray(produits) || produits.length === 0) return reject("Veuillez ajouter au moins un produit");
    if (tva === undefined || tva < 0 || tva > 100) return reject("TVA invalide");

    // Mise à jour de la facture proforma
    Proforma.findByIdAndUpdate(
      id,
      { dateFacture: new Date(dateFacture), clientNom, tva, produits },
      { new: true, runValidators: true }
    )
      .then((updatedProforma) => {
        if (!updatedProforma) return reject("Proforma introuvable");
        resolve(`Proforma "${updatedProforma.numeroFacture}" mise à jour avec succès`);
      })
      .catch((err) => {
        console.error("Erreur lors de la modification de la proforma:", err);
        reject("Erreur lors de la mise à jour de la proforma");
      });
  });
};




// Supprimer une facture Proforma

exports.supprimerProforma = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject("ID de la facture manquant");
    }

    Proforma.findByIdAndDelete(id)
      .then((result) => {
        if (!result) {
          return reject("Facture introuvable ou déjà supprimée");
        }
        resolve("Facture Proforma supprimée avec succès");
      })
      .catch((err) => {
        reject("Erreur lors de la suppression de la facture");
      });
  });
};








// Récupérer tous les Factures Proforma par date

exports.filtrerParDate = (dateDebut, dateFin) => {
  return new Promise((resolve, reject) => {
    if (!dateDebut || !dateFin) return reject("Les deux dates sont requises");

    Proforma.find({
      dateFacture: { 
        $gte: new Date(dateDebut),  // dateDebut incluse
        $lte: new Date(dateFin)     // dateFin incluse
      }
    })
      .then((stocks) => resolve(stocks))
      .catch((err) => reject("Erreur lors du filtrage par date d'entrée."));
  });
};


