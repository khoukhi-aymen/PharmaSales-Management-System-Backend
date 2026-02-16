const mongoose = require("mongoose");

/* ============================
   Sous-schéma Produits
============================ */
const produitSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
  quantite: { type: String, required: true }
});

/* ============================
   Schéma Commande Client (Vente)
============================ */
const VenteSchema = new mongoose.Schema({
  numeroVente: { type: String, required: true, unique: true, trim: true },
  dateVente: { type: Date, required: true, default: Date.now },
  clientNom: { type: String, required: true, trim: true },
  etat: {type: String,enum: ["brouillon", "validée", "livrée", "facturée", "annulée"],default: "brouillon"},
  tva: { type: Number, required: true, min: 0, max: 100, default: 19 },
  produits: [produitSchema],
  proformaId: { type: mongoose.Schema.Types.ObjectId, ref: "Proforma", required: false },
  createdAt: { type: Date, default: Date.now }
});

/* ============================
   Compteur pour NumeroVente
============================ */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // "vente"
  seq: { type: Number, default: 0 }
});

// Vérification si le modèle existe déjà
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* ============================
   Génération NumeroVente
============================ */
function getNextNumeroVente() {
  return new Promise((resolve, reject) => {
    Counter.findByIdAndUpdate(
      { _id: "vente" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
      .then(counter => {
        const year = new Date().getFullYear();
        const number = String(counter.seq).padStart(5, "0");
        resolve(`V-${year}-${number}`);
      })
      .catch(() => reject("Erreur lors de la génération du numéro de vente"));
  });
}

/* ============================
   Modèle
============================ */
const Vente = mongoose.models.Vente || mongoose.model("Vente", VenteSchema);

module.exports = { Vente, getNextNumeroVente };
