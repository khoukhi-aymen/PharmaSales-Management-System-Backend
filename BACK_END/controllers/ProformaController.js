const ProformaModel = require("../models/ProformaModel");
const PDFDocument = require("pdfkit");


function extraireNombre(str) {
    const match = str.match(/[\d,.]+/); // Cherche le premier nombre
    if (!match) return 0; // Pas de nombre trouvé → 0
    return parseFloat(match[0].replace(',', '.')); // Remplace la virgule par un point si nécessaire
}



// Récupérer tous les Produits du Stock

exports.getAllProducts = (req, res) => {
  ProformaModel.getAllProducts()
    .then((data) => {
      return res.json({ data });
    })
    .catch((err) => {
      return res.status(500).json({ message: err });
    });
};


//  Ajouter une proforma

exports.ajouterProforma = (req, res) => {
  const { dateFacture, clientNom, produits, tva } = req.body;

  ProformaModel.ajouterProforma({ dateFacture, clientNom, produits, tva })
    .then(message => res.json({ message }))
    .catch(err => res.status(400).json({ message: err }));
};



// Récupérer toutes les proformas du jour

exports.getAllProformas = (req, res) => {
  ProformaModel.getAllProforma()
    .then(data => {
      res.json({ data })
    })
    .catch(err => res.status(500).json({ message: err }));
};



// Controller pour générer le PDF

exports.generatePdf = (req, res) => {
  ProformaModel.getProformaById(req.params.id)
    .then(proforma => {

      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Headers AVANT
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=proforma-${proforma.numeroFacture}.pdf`
      );
      doc.pipe(res);

      let y = 40;

      // =======================
      // ENTÊTE ENTREPRISE
      // =======================
      doc.rect(40, y, 515, 60).fill("#0d6efd");
      doc.fillColor("#ffffff").fontSize(18)
        .text("MON ENTREPRISE SARL", 55, y + 12);
      doc.fontSize(10)
        .text("Adresse : 123 Rue Exemple, Ville, Pays", 55, y + 35);
      doc.fillColor("#000000");

      y += 80;

      // =======================
      // TITRE
      // =======================
      doc.fontSize(22).fillColor("#000000")
        .text("FACTURE PROFORMA", 40, y, { align: "center" });

      y += 40;
      doc.fillColor("#000000");


      doc.fontSize(12).font("Helvetica").text("Client :", 40, y);
      doc.font("Helvetica-Bold").text(`${proforma.clientNom}`, 90, y);
      doc.font("Helvetica").text("Date :", 40, y + 18);
      doc.font("Helvetica-Bold").text(`${new Date(proforma.dateFacture).toLocaleDateString()}`, 80, y + 18);
      doc.font("Helvetica").text("Numéro :", 410, y);
      doc.font("Helvetica-Bold").text(`${proforma.numeroFacture}`, 460, y);
      y += 50;

      // =======================
      // TABLE PRODUITS
      // =======================
      doc.font("Helvetica-Bold").text("Liste des produits", 40, y);
      y += 15;

      const startX = 40;
      const colWidths = [200, 80, 90, 145];
      const rowHeight = 25;

      // Entête tableau
      doc.font("Helvetica-Bold").fillColor("#000000ff");
      let x = startX;

      ["Produit", "Qté", "Prix U.", "Total HT"].forEach((h, i) => {
        doc.rect(x, y, colWidths[i], rowHeight).fill("#0d6efd").stroke();
        doc.fillColor("#ffffff").text(h, x + 5, y + 7, {
          width: colWidths[i] - 10,
          align: i >= 2 ? "right" : "left"
        });
        x += colWidths[i];
      });

      y += rowHeight;
      doc.font("Helvetica").fillColor("#000000");

      // Lignes produits
      let totalHT = 0;
      let totalTVA = 0;

      proforma.produits.forEach((p, index) => {
        x = startX;

        if (index % 2 === 0) {
          doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
            .fill("#f2f2f2").stroke();
        }

        const qte = Number(extraireNombre(p.quantite));
        const prixHT = p.prix * qte;
        const tva = (proforma.tva ?? 0);
        totalHT += prixHT;
        totalTVA += prixHT * tva / 100;

        [p.nom, qte, p.prix.toFixed(2), prixHT.toFixed(2)].forEach((val, i) => {
          doc.rect(x, y, colWidths[i], rowHeight).stroke();
          doc.fillColor("#000000")
            .text(val.toString(), x + 5, y + 7, {
              width: colWidths[i] - 10,
              align: i >= 2 ? "right" : "left"
            });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      // =======================
      // TOTAUX (DROITE)
      // =======================
      y += 10;
      const totalX = startX + colWidths[0] + colWidths[1] + colWidths[2];
      const totalWidth = colWidths[3];

      doc.font("Helvetica-Bold");
      doc.rect(totalX, y, totalWidth, 20).stroke();
      doc.text(`Total HT : ${totalHT.toFixed(2)} DA`,
        totalX + 5, y + 5, { width: totalWidth - 10, align: "right" });
      y += 22;

      if (totalTVA > 0) {
        doc.rect(totalX, y, totalWidth, 20).stroke();
        doc.text(`TVA : ${totalTVA.toFixed(2)} DA`,
          totalX + 5, y + 5, { width: totalWidth - 10, align: "right" });
        y += 22;

        doc.rect(totalX, y, totalWidth, 20).stroke();
        doc.text(`Total TTC : ${(totalHT + totalTVA).toFixed(2)} DA`,
          totalX + 5, y + 5, { width: totalWidth - 10, align: "right" });
      }

      doc.end();
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: err.toString() });
    });
};





// Modifier une facture Proforma

exports.modifierProforma = (req, res) => {
  const { id } = req.params;
  const { dateFacture, clientNom, tva, produits } = req.body;

  ProformaModel.modifierProforma(id, { dateFacture, clientNom, tva, produits })
    .then((message) => res.json({ message }))
    .catch((err) => res.status(400).json({ message: err }));
};

// Supprimer une facture Proforma

exports.supprimerProforma = (req, res) => {
  const { id } = req.params;

  ProformaModel.supprimerProforma(id)
    .then((message) => {
      return res.json({ message });
    })
    .catch((err) => {
      return res.status(400).json({ message: err });
    });
};





// Récupérer tous les Factures Froforma par date

exports.filtrerParDate = (req, res) => {
  const { dateDebut, dateFin } = req.query;

  ProformaModel.filtrerParDate(dateDebut, dateFin)
    .then((data) => res.json({ data }))
    .catch((err) => res.status(400).json({ message: err }));
};

