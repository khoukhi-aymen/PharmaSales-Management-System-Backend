const VenteModel = require("../models/VenteModel");
const PDFDocument = require("pdfkit");

// Fonction utilitaire pour extraire le nombre depuis une string

function extraireNombre(str) {
    const match = str.match(/[\d,.]+/); // Cherche le premier nombre
    if (!match) return 0; // Pas de nombre trouvé → 0
    return parseFloat(match[0].replace(',', '.')); // Remplace la virgule par un point si nécessaire
}



//  Ajouter une proforma

exports.ajouterVente = (req, res) => {
  const { dateVente, clientNom, tva, produits, proformaId } = req.body;
  console.log("hello")

  VenteModel.ajouterVente({ dateVente, clientNom, tva, produits, proformaId })
    .then(message => res.json({ message }))
    .catch(err => res.status(400).json({ message: err }));
};



// Récupérer toutes les commandes clients du jour

exports.getAllVentes = (req, res) => {
  VenteModel.getAllVentes()
    .then(data => res.json({ data }))
    .catch(err => res.status(500).json({ message: err }));
};



// Controller pour générer le PDF (BL ou Facture)

exports.generatePdf = (req, res) => {
  VenteModel.getVenteById(req.params.id)
    .then(vente => {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const startX = 50;
      let y = 20;

      // --- ENTÊTE ENTREPRISE ---
      doc.rect(startX, y, 540, 60).fill("#0d6efd");
      doc.fillColor("#ffffff").fontSize(18).text("MON ENTREPRISE SARL", startX + 10, y + 10);
      doc.fillColor("#ffffff").fontSize(10).text("Adresse : 123 Rue Exemple, Ville, Pays", startX + 10, y + 35);
      doc.fillColor("#000000");
      y += 90;

      if (vente.etat === "livrée") {
        // --- TITRE BL ---
        doc.fontSize(22).fillColor("#000000").text("BON DE LIVRAISON", startX, y, { align: "center" });
        y += 50;

        // --- INFO CLIENT ET BL ---
        doc.fontSize(12).fillColor("#000000"); // tout en noir

        // Client : NomClient
        doc.font("Helvetica").text("Client : ", startX, y); // "Client :" normal
        doc.font("Helvetica-Bold").text(`${vente.clientNom}`, startX + 60, y); // NomClient en gras

        // Date BL : 2025-12-26
        doc.font("Helvetica").text("Date BL : ", startX, y + 15); // "Date BL :" normal
        doc.font("Helvetica-Bold").text(`${new Date(vente.dateVente).toLocaleDateString()}`, startX + 60, y + 15); // date en gras

        // Numéro BL : V-2025-00026
        doc.font("Helvetica").text("Numéro BL : ", startX + 340, y); // "Numéro BL :" normal
        doc.font("Helvetica-Bold").text(`${vente.numeroVente}`, startX + 410, y); // numéro en gras

        y += 40; // avancer le curseur

        // --- TABLEAU PRODUITS BL ---
        const colWidths = [40, 400, 100];
        const rowHeight = 25;
        const headers = ["N°", "Produit", "Quantité"];
        let x = startX;
        doc.font("Helvetica-Bold").fillColor("#ffffff");
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#0d6efd").stroke();
        headers.forEach((h, i) => {
          doc.fillColor("#ffffff").text(h, x + 5, y + 7, { width: colWidths[i] - 10, align: "center" });
          x += colWidths[i];
        });
        y += rowHeight;
        doc.font("Helvetica").fillColor("#000000");

        vente.produits.forEach((p, index) => {
          x = startX;
          if (index % 2 === 0) doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#f2f2f2").stroke();
          const values = [index + 1, p.nom, p.quantite];
          values.forEach((val, i) => {
            doc.rect(x, y, colWidths[i], rowHeight).stroke();
            doc.fillColor("#000000").text(val.toString(), x + 5, y + 7, { width: colWidths[i] - 10, align: i === 1 ? "left" : "center" });
            x += colWidths[i];
          });
          y += rowHeight;
        });

        y += 30;
        // --- SIGNATURES ---
        doc.text("Fournisseur :", startX, y);
        doc.text("_________________________", startX, y + 15);
        doc.text("Client :", startX + 300, y);
        doc.text("_________________________", startX + 300, y + 15);
        doc.text("Cachet entreprise :", startX, y + 50);

      } else if (vente.etat === "facturée") {
        // --- TITRE FACTURE ---
        doc.fontSize(22).fillColor("#000000").text("FACTURE", startX, y, { align: "center" });
        y += 50;

        // --- INFO CLIENT ET FACTURE ---
        doc.fontSize(12).font("Helvetica").text("Client :", startX, y);
        doc.font("Helvetica-Bold").text(`${vente.clientNom}`, startX + 60, y);
        doc.font("Helvetica").text("Date :", startX, y + 15);
        doc.font("Helvetica-Bold").text(`${new Date(vente.dateVente).toLocaleDateString()}`, startX + 60, y + 15);
        doc.font("Helvetica").text("Numéro :", startX + 370, y);
        doc.font("Helvetica-Bold").text(`${vente.numeroVente}`, startX + 420, y);
        y += 40;

        // --- TABLEAU PRODUITS FACTURE ---
        const colWidths = [50, 250, 80, 80, 80]; // N°, Produit, Quantité, PU, Total
        const rowHeight = 25;
        const headers = ["N°", "Produit", "Quantité", "Prix U.", "Total HT"];
        x = startX;
        doc.font("Helvetica-Bold").fillColor("#ffffff");
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#0d6efd").stroke();
        headers.forEach((h, i) => {
          doc.fillColor("#ffffff").text(h, x + 5, y + 7, { width: colWidths[i] - 10, align: "center" });
          x += colWidths[i];
        });
        y += rowHeight;
        doc.font("Helvetica").fillColor("#000000");

        let totalHT = 0;
        let totalTVA = 0;
        vente.produits.forEach((p, index) => {
          x = startX;
          if (index % 2 === 0) doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#f2f2f2").stroke();
          const quantite = p.quantite;
          const pu = p.prix.toFixed(2);
          const total = (p.prix * parseFloat(quantite)).toFixed(2);
          totalHT += parseFloat(total);
          const values = [index + 1, p.nom, quantite, pu, total];
          values.forEach((val, i) => {
            doc.rect(x, y, colWidths[i], rowHeight).stroke();
            doc.fillColor("#000000").text(val.toString(), x + 5, y + 7, { width: colWidths[i] - 10, align: i > 2 ? "right" : i === 1 ? "left" : "center" });
            x += colWidths[i];
          });
          y += rowHeight;
        });

        y += 10;

        // --- TOT AUX (Total HT, TVA, TTC) ---
        const totalColsWidth = colWidths[2] + colWidths[3] + colWidths[4]; // Quantité + Prix U. + Total
        const labelX = startX + colWidths[0] + colWidths[1]; // N° + Produit
        const summaryRowHeight = 20;

        // Total HT
        doc.rect(labelX, y, totalColsWidth, summaryRowHeight).stroke();
        doc.font("Helvetica-Bold").text(`Total HT: ${totalHT.toFixed(2)} DA`, labelX + 5, y + 5, { width: totalColsWidth - 10, align: "right" });
        y += summaryRowHeight;

        // TVA
        if (vente.tva > 0) {
          const tvaAmount = totalHT * (vente.tva / 100);
          totalTVA = tvaAmount;
          doc.rect(labelX, y, totalColsWidth, summaryRowHeight).stroke();
          doc.font("Helvetica-Bold").text(`TVA (${vente.tva}%): ${tvaAmount.toFixed(2)} DA`, labelX + 5, y + 5, { width: totalColsWidth - 10, align: "right" });
          y += summaryRowHeight;

          // Total TTC
          const totalTTC = totalHT + tvaAmount;
          doc.rect(labelX, y, totalColsWidth, summaryRowHeight).stroke();
          doc.font("Helvetica-Bold").text(`Total TTC: ${totalTTC.toFixed(2)} DA`, labelX + 5, y + 5, { width: totalColsWidth - 10, align: "right" });
          y += summaryRowHeight;
        }

        // --- CACHET ENTREPRISE ---
        y += 40; // laisser un espace avant le cachet
        doc.font("Helvetica").fontSize(12).text("Cachet entreprise :", startX, y);
        doc.text("_________________________", startX, y + 15);
      }

      // --- ENVOI PDF ---
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${vente.numeroVente}.pdf`);
      doc.pipe(res);
      doc.end();
    })
    .catch(err => {
      console.error("Erreur PDF:", err);
      res.status(500).json({ message: err.toString() });
    });
};

// Modifier une vente

exports.modifierVente = (req, res) => {

  VenteModel.modifierVente(req.params.id, req.body)
  .then(({ message, vente }) => res.json({ message, vente }))
  .catch(err => res.status(400).json({ message: err }));

};



// Supprimer une vente

exports.supprimerVente = (req, res) => {
  const { id } = req.params;

  VenteModel.supprimerVente(id)
    .then((message) => {
      res.json({ message });
    })
    .catch((err) => {
      res.status(400).json({ message: err });
    });
};



// Modifier l'état d'une vente

exports.modifierEtatVente = (req, res) => {
  const { id } = req.params;
  const { etat } = req.body;

  VenteModel.modifierEtatVente(id, etat)
    .then((message) => res.json({ message }))
    .catch((err) => res.status(400).json({ message: err }));
};



// Récupérer toutes les ventes par date


exports.filtrerParDate = (req, res) => {
  const { dateDebut, dateFin } = req.query;

  VenteModel.filtrerParDate(dateDebut, dateFin)
    .then((data) => res.json({ data }))
    .catch((err) => res.status(400).json({ message: err }));
};



