const { Achat, getNextNumeroAchat } = require("./Schémas/Achat");
const Stock = require("./Schémas/Stock");
const mongoose = require("mongoose");


//  Ajouter un Achat fournisseur avec numéro automatique

exports.ajouterAchat = ({ dateCommande, fournisseurNom, modePaiement, produits }) => {
  return new Promise((resolve, reject) => {
    // Vérifications
    if (!dateCommande || !fournisseurNom || !modePaiement)
      return reject("Tous les champs fournisseur sont requis");

    if (!Array.isArray(produits) || produits.length === 0)
      return reject("Veuillez ajouter au moins un produit");

    // Génération du numéro d'achat automatique
    getNextNumeroAchat()
      .then(numeroAchat => {
        produits = produits.map(p => {
          if (p.estManuel) {
            delete p.id; // pour s'assure qu'aucun id invalide n'est envoyé
          }
          return p;
        });
        const nouvelAchat = new Achat({
          numeroAchat,
          dateCommande: dateCommande ? new Date(dateCommande) : new Date(),
          fournisseurNom,
          modePaiement,
          produits
        });

        // Sauvegarde
        return nouvelAchat.save()
          .then(() => resolve("Achat ajouté avec succès !"))
          .catch(()=> reject("Erreur lors de l'ajout de l'achat"));
      })
      .catch(err => reject("Erreur lors de l'ajout de l'achat"));
  });
};





// Récupérer tous les achats de la journée

exports.getAllAchatsDuJour = () => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    Achat.find({ dateCommande: { $gte: startOfDay, $lte: endOfDay } })
      .sort({ dateCommande: -1 })
      .then(data => resolve(data))
      .catch(() => reject("Erreur lors de la récupération des achats du jour"));
  });
};



// Récupérer l'achat par ID pour PDF


exports.getAchatById = (id) => {
  return new Promise((resolve, reject) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reject("ID invalide");
    }

    Achat.findById(id)
      .then((achat) => {
        if (!achat) return reject("Achat introuvable");
        resolve(achat);
      })
      .catch((err) => {
        console.log("Erreur MongoDB:", err);
        reject("Erreur lors de la récupération de l'achat");
      });
  });
};

//Modifier un achat fournisseur


exports.modifierAchat = (id, { dateCommande, fournisseurNom, modePaiement, produits }) => {
  return new Promise((resolve, reject) => {

    /* =========================
       Vérifications basiques
    ========================== */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reject("ID achat invalide");
    }

    if (!dateCommande || !fournisseurNom || !modePaiement) {
      return reject("Tous les champs fournisseur sont requis");
    }

    if (!Array.isArray(produits) || produits.length === 0) {
      return reject("Veuillez ajouter au moins un produit");
    }

    /* =========================
       Vérifier achat + état
    ========================== */
    Achat.findById(id)
      .then(achat => {
        if (!achat) return reject("Achat introuvable");

        if (achat.etat !== "brouillon") {
          return reject(`Modification interdite : commande ${achat.etat}`);
        }

        /* =========================
           Traitement du STOCK
        ========================== */
        const stockPromises = produits.map(p => {

          // Produit EXISTANT (lié au stock)
          if (p.id && mongoose.Types.ObjectId.isValid(p.id)) {
            return Stock.findById(p.id)
              .then(stock => {
                if (!stock) return;

                stock.prixUnitaire = Number(p.prix);
                stock.quantite = (
                  Number(stock.quantite) + Number(p.quantite)
                ).toString();

                stock.dateEntree = new Date();
                stock.fournisseur = fournisseurNom;

                return stock.save();
              });
          }

          // Produit MANUEL → création dans le stock
          return new Stock({
            produit: p.nom,
            prixUnitaire: Number(p.prix),
            quantite: p.quantite.toString(),
            dateEntree: new Date(),
            dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // exemple
            fournisseur: fournisseurNom
          }).save();
        });

        // Exécuter toutes les mises à jour stock
        return Promise.all(stockPromises)
          .then(() => achat);
      })

      /* =========================
         Mise à jour de l'achat
      ========================== */
      .then(() => {
        return Achat.findByIdAndUpdate(
          id,
          {
            dateCommande: new Date(dateCommande),
            fournisseurNom,
            modePaiement,
            produits,
            etat: "validée"
          },
          { new: true, runValidators: true }
        );
      })

      /* =========================
         Résultat final
      ========================== */
      .then(updatedAchat => {
        resolve({
          message: `Commande fournisseur "${updatedAchat.numeroAchat}" validée et stock mis à jour`,
          achat: updatedAchat
        });
      })

      .catch(err => {
        console.error("Erreur modification achat :", err);
        reject("Erreur lors de la mise à jour de l'achat fournisseur");
      });
  });
};




// Supprimer un achat fournisseur

exports.supprimerAchat = (id) => {
  return new Promise((resolve, reject) => {

    // Vérification ID
    if (!id) {
      return reject("ID de l'achat manquant");
    }

    // Vérifier si l'achat existe
    Achat.findById(id)
      .then((achat) => {

        if (!achat) {
          return reject("Commande fournisseur introuvable");
        }

        // Sécurité métier
        if (achat.etat !== "brouillon") {
          return reject(
            "Suppression interdite : seule une commande en brouillon peut être supprimée"
          );
        }

        // Suppression
        return Achat.findByIdAndDelete(id);
      })
      .then(() => {
        resolve("Commande fournisseur supprimée avec succès");
      })
      .catch(() => {
        reject("Erreur lors de la suppression de la commande fournisseur");
      });
  });
};



// Modifier l'état d'une vente

exports.modifierEtatAchat = (id, nouvelEtat) => {
  return new Promise((resolve, reject) => {

    const etatsValides = ["brouillon", "validée"];
    if (!etatsValides.includes(nouvelEtat)) {
      return reject("État invalide");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reject("ID achat invalide");
    }

    Achat.findById(id)
      .then(achat => {
        if (!achat) return reject("Achat introuvable");

        /* =============================
           VALIDÉE → BROUILLON
           → RETIRER DU STOCK
        ============================== */
        if (achat.etat === "validée" && nouvelEtat === "brouillon") {
          const stockPromises = achat.produits.map(p => {
            if (!p.id) return;
            return Stock.findById(p.id).then(stock => {
              if (!stock) return;
              stock.quantite = (
                Number(stock.quantite) - Number(p.quantite)
              ).toString();
              return stock.save();
            });
          });

          return Promise.all(stockPromises).then(() => achat);
        }

        return achat;
      })
      .then(achat => {
        achat.etat = nouvelEtat;
        return achat.save();
      })
      .then(updatedAchat => {
        resolve({
          message: "Brouillon restauré, stock corrigé",
          achat: updatedAchat
        });
      })
      .catch(err => {
        console.error("Erreur état achat :", err);
        reject("Erreur lors du changement d’état de l’achat");
      });
  });
};




// Récupérer tous les Achats par date

exports.filtrerParDate = (dateDebut, dateFin) => {
  return new Promise((resolve, reject) => {
    if (!dateDebut || !dateFin) {
      return reject("Les deux dates sont requises");
    }

    const startDate = new Date(dateDebut);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateFin);
    endDate.setHours(23, 59, 59, 999);

    Achat.find({
      dateCommande: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .then((achats) => resolve(achats))
      .catch(() =>
        reject("Erreur lors du filtrage des achats par date")
      );
  });
};

