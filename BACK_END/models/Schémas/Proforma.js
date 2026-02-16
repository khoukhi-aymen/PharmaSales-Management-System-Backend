const mongoose = require("mongoose");

// Sous-schéma pour les produits
const produitSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
  quantite: { type: String, required: true },
});

// Schéma principal Proforma
const proformaSchema = new mongoose.Schema({
  numeroFacture: { type: String, required: true, trim: true },
  dateFacture: { type: Date, required: true },
  clientNom: { type: String, required: true, trim: true },
  tva: {type: Number, required: true, min: 0, max: 100, default: 19},
  produits: [produitSchema],
  createdAt: { type: Date, default: Date.now },
});

// Modèle pour le compteur des factures
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // "proforma"
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

// Fonction pour générer le prochain numéro de facture
function getNextInvoiceNumber() {
  return new Promise((resolve, reject) => {
    Counter.findByIdAndUpdate(
      { _id: "proforma" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    .then(counter => {
      const year = new Date().getFullYear();
      const number = String(counter.seq).padStart(5, "0");
      resolve(`PF-${year}-${number}`);
    })
    .catch(err => reject("Erreur lors de la génération du numéro de facture"));
  });
}

const Proforma = mongoose.model("Proforma", proformaSchema);

module.exports = {Proforma,getNextInvoiceNumber};
