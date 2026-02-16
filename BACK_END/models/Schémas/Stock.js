const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  produit: { type: String, required: true, trim: true },
  prixUnitaire: { type: Number, required: true, min: 0 },
  quantite: { type: String, required: true, trim: true },
  dateEntree: { type: Date, required: true },
  dateExpiration: { type: Date, required: true },
  fournisseur: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Stock", stockSchema);
