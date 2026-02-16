const { Vente, getNextNumeroVente } = require("./Schémas/Vente");
const Stock = require("./Schémas/Stock");





// Ajouter une proforma avec numéro automatique

exports.ajouterVente = ({ dateVente, clientNom, tva, produits, proformaId }) => {
  return new Promise((resolve, reject) => {
    // Vérifications des champs
    if (!dateVente || !clientNom ) return reject("Tous les champs sont requis");
    if (!Array.isArray(produits) || produits.length === 0) return reject("Veuillez ajouter au moins un produit");
    if (tva === undefined || tva < 0 || tva > 100) return reject("TVA invalide");

    // Génération automatique du numéro de vente
    getNextNumeroVente()
      .then(numeroVente => {
        const nouvelleCommande = new Vente({
          numeroVente,
          dateVente: dateVente ? new Date(dateVente) : new Date(),
          clientNom,
          tva,
          produits
        });

        // Sauvegarde dans la base
        return nouvelleCommande.save()
          .then(() => resolve("Commande client ajoutée avec succès !"))
          .catch(() => reject("Erreur lors de l'ajout de la commande client"));
      })
      .catch(err => reject(err));
  });
};



// Récupérer toutes les commandes clients de la journée

exports.getAllVentes = () => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    Vente.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ createdAt: -1 })
      .then(data => resolve(data))
      .catch(() => reject("Erreur lors de la récupération des commandes clients"));
  });
};



// Récupérer une Vente par ID pour la génération PDF BL ou Facture


exports.getVenteById = (id) => {
  return new Promise((resolve, reject) => {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return reject("ID invalide");
    }

    Vente.findById(id)
      .then(vente => {
        if (!vente) return reject("Vente introuvable");
        resolve(vente);
      })
      .catch(err => {
        console.log("Erreur MongoDB:", err);
        reject("Erreur lors de la récupération de la vente");
      });
  });
};


// Modifier une vente

exports.modifierVente = (id, { dateVente, clientNom, tva, produits }) => {
  return new Promise((resolve, reject) => {
    // Vérifications basiques
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return reject("ID invalide");
    if (!dateVente || !clientNom) return reject("Tous les champs client sont requis");
    if (!Array.isArray(produits) || produits.length === 0) return reject("Veuillez ajouter au moins un produit");
    if (tva === undefined || tva < 0 || tva > 100) return reject("TVA invalide");

    // Vérification de l'état avant mise à jour
    Vente.findById(id)
      .then(vente => {
        if (!vente) return reject("Vente introuvable");

        //Sécurité métier
        if (vente.etat !== "brouillon") {
          return reject(`Modification interdite : commande ${vente.etat}`);
        }

        // Mise à jour
        return Vente.findByIdAndUpdate(
          id,
          { dateVente: new Date(dateVente), clientNom, tva, produits,etat: "validée" },
          { new: true, runValidators: true }
        );
      })
      .then(updatedVente => {
        if (!updatedVente) return; // déjà rejeté si introuvable
        resolve({
          message: `Commande Client "${updatedVente.numeroVente}" validée`,
          vente: updatedVente
        });
      })
      .catch(err => {
        console.error("Erreur lors de la modification de la vente:", err);
        reject("Erreur lors de la mise à jour de la vente");
      });
  });
};




// Supprimer une vente

exports.supprimerVente = (id) => {
  return new Promise((resolve, reject) => {
    if (!id) return reject("ID de la vente manquant");

    Vente.findById(id)
      .then((vente) => {
        if (!vente) {
          return reject("Commande introuvable");
        }

        // Sécurité métier
        if (vente.etat !== "brouillon") {
          return reject(
            "Suppression interdite : seule une commande en brouillon peut être supprimée"
          );
        }

        return Vente.findByIdAndDelete(id);
      })
      .then(() => resolve("Commande client supprimée avec succès"))
      .catch(() => reject("Erreur lors de la suppression de la commande"));
  });
};


// Modifier l'état d'une vente

exports.modifierEtatVente = (id, nouvelEtat) => {
  return new Promise((resolve, reject) => {
    const etatsValides = ["brouillon", "validée", "livrée", "facturée", "annulée"];
    if (!etatsValides.includes(nouvelEtat)) return reject("État invalide");

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return reject("ID invalide");

    Vente.findById(id)
      .then(vente => {
        if (!vente) return reject("Vente introuvable");

        if (vente.etat === "annulée") {
          return reject("Impossible de modifier une vente annulée");
        }

        // =============================
        // CAS 1 : VALIDÉE → LIVRÉE (diminuer stock)
        // =============================
        if (vente.etat === "validée" && nouvelEtat === "livrée") {
          const diminuerStock = vente.produits.map(p => {
            return Stock.findById(p.id).then(stock => {
              if (!stock) return Promise.reject(`Produit introuvable : ${p.nom}`);

              if (Number(stock.quantite) < Number(p.quantite)) {
                return Promise.reject(`Stock insuffisant pour ${p.nom} reste : ${stock.quantite}`);
              }

              stock.quantite = Number(stock.quantite) - Number(p.quantite);
              return stock.save();
            });
          });

          return Promise.all(diminuerStock).then(() => vente);
        }

        // =============================
        // CAS 2 : LIVRÉE → BROUILLON (restaurer stock)
        // =============================
        if (vente.etat === "livrée" && nouvelEtat === "brouillon") {
          const restaurerStock = vente.produits.map(p => {
            return Stock.findById(p.id).then(stock => {
              if (!stock) return Promise.reject(`Produit introuvable : ${p.nom}`);

              stock.quantite = Number(stock.quantite) + Number(p.quantite);
              return stock.save();
            });
          });

          return Promise.all(restaurerStock).then(() => vente);
        }

        // =============================
        // AUTRES CAS : pas d’impact stock
        // =============================
        return vente;
      })
      .then(vente => {
        vente.etat = nouvelEtat;
        return vente.save();
      })
      .then(updatedVente => {
        if (updatedVente.etat === "brouillon") {
          message = "Commande en brouillon, stock mis à jour";
        }

        if (updatedVente.etat === "livrée") {
          message = "Commande livrée, stock mis à jour. Imprimer le BL";
        }

        if (updatedVente.etat === "facturée") {
          message = "Commande facturée. Imprimer la facture";
        }

        if (updatedVente.etat === "annulée") {
          message = "Commande annulée";
        }

        resolve(message);
      })
      .catch(err => {
        console.error("Erreur changement état vente :", err);
        reject(typeof err === "string" ? err : "Erreur lors du changement d'état");
      });
  });
};




// Filtrer les ventes par plage de dates



exports.filtrerParDate = (dateDebut, dateFin) => {
  return new Promise((resolve, reject) => {
    if (!dateDebut || !dateFin) return reject("Les deux dates sont requises");

    // On transforme les dates en objets Date
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999); // Inclure toute la journée de fin

    Vente.find({
      dateVente: { 
        $gte: debut,
        $lte: fin
      }
    })
      .then((ventes) => resolve(ventes))
      .catch((err) => reject("Erreur lors du filtrage par date de vente"));
  });
};


