const mongoose = require("mongoose");

/* ============================
   Sous-schéma Produits
============================ */
const produitSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: function() { return !this.estManuel } },
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
  quantite: { type: String, required: true },
  estManuel: { type: Boolean, default: false }, // indique si le produit a été ajouté manuellement
});

/* ============================
   Schéma Achat Fournisseur
============================ */
const AchatSchema = new mongoose.Schema({
  numeroAchat: { type: String, required: true, unique: true, trim: true },
  dateCommande: { type: Date, required: true, default: Date.now },
  fournisseurNom: { type: String, required: true, trim: true },
  modePaiement: { type: String, enum: ["Espèces", "Carte Bancaire", "Virement Bancaire", "Chèque"], required: true },
  etat: { type: String, enum: ["validée", "brouillon"], default: "brouillon" },
  produits: [produitSchema],
  createdAt: { type: Date, default: Date.now }
});

/* ============================
   Compteur pour numeroAchat
============================ */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // "achat"
  seq: { type: Number, default: 0 }
});

// Vérification si le modèle existe déjà
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* ============================
   Génération numeroAchat
============================ */
function getNextNumeroAchat() {
  return new Promise((resolve, reject) => {
    Counter.findByIdAndUpdate(
      { _id: "achat" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    .then(counter => {
      const year = new Date().getFullYear();
      const number = String(counter.seq).padStart(5, "0");
      resolve(`A-${year}-${number}`);
    })
    .catch(() => reject("Erreur lors de la génération du numéro d'achat"));
  });
}

/* ============================
   Modèle
============================ */
const Achat = mongoose.models.Achat || mongoose.model("Achat", AchatSchema);

module.exports = { Achat, getNextNumeroAchat };
