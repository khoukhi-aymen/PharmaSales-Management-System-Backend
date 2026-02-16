const AchatModel = require("../models/AchatModel");
const PDFDocument = require("pdfkit");


function extraireNombre(str) {
    const match = str.match(/[\d,.]+/); // Cherche le premier nombre
    if (!match) return 0; // Pas de nombre trouvé → 0
    return parseFloat(match[0].replace(',', '.')); // Remplace la virgule par un point si nécessaire
}


//  Ajouter un Achat

exports.ajouterAchat = (req, res) => {
  const { dateCommande, fournisseurNom, modePaiement, produits } = req.body;

  AchatModel.ajouterAchat({ dateCommande, fournisseurNom, modePaiement, produits })
    .then(message => res.json({ message }))
    .catch(err => res.status(400).json({ message: err }));
};



// Tous les achats du jour

exports.getAchatsDuJour = (req, res) => {
  AchatModel.getAllAchatsDuJour()
    .then(data => res.json({ data }))
    .catch(err => res.status(500).json({ message: err }));
};




// Générer le PDF du bon de commande

exports.generatePdf = (req, res) => {
  AchatModel.getAchatById(req.params.id)
    .then((achat) => {

      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=bon-commande-${achat.numeroAchat}.pdf`
      );

      doc.pipe(res);

      let y = 40;

      /* =======================
         ENTÊTE ENTREPRISE
      ======================= */
      doc.rect(40, y, 515, 60).fill("#198754");
      doc.fillColor("#ffffff").fontSize(18)
        .text("MON ENTREPRISE SARL", 55, y + 12);
      doc.fontSize(10)
        .text("Adresse : 123 Rue Exemple, Ville, Pays", 55, y + 35);
      doc.fillColor("#000000");

      y += 80;

      /* =======================
         TITRE
      ======================= */
      doc.fontSize(22)
        .text("BON DE COMMANDE", 40, y, { align: "center" });

      y += 40;

      /* =======================
         INFOS ACHAT
      ======================= */
      doc.fontSize(12).font("Helvetica").text("Fournisseur :", 40, y);
      doc.font("Helvetica-Bold").text(achat.fournisseurNom, 120, y);

      doc.font("Helvetica").text("Date :", 40, y + 18);
      doc.font("Helvetica-Bold")
        .text(new Date(achat.dateCommande).toLocaleDateString(), 80, y + 18);

      doc.font("Helvetica").text("Numéro :", 400, y);
      doc.font("Helvetica-Bold").text(achat.numeroAchat, 460, y);

      // Mode de paiement
      doc.font("Helvetica").text("Mode de paiement :", 40, y + 36);
      doc.font("Helvetica-Bold").text(achat.modePaiement, 150, y + 36);

      y += 70;

      /* =======================
         TABLE PRODUITS
      ======================= */
      doc.font("Helvetica-Bold").text("Liste des produits commandés", 40, y);
      y += 15;

      const startX = 40;
      const colWidths = [60, 320, 135];
      const rowHeight = 25;

      // En-tête tableau
      let x = startX;
      doc.font("Helvetica-Bold");

      ["N°", "Produit", "Quantité"].forEach((h, i) => {
        doc.rect(x, y, colWidths[i], rowHeight).fill("#198754").stroke();
        doc.fillColor("#ffffff").text(h, x + 5, y + 7, {
          width: colWidths[i] - 10,
          align: i === 0 ? "center" : "left",
        });
        x += colWidths[i];
      });

      y += rowHeight;
      doc.font("Helvetica").fillColor("#000000");

      /* =======================
         LIGNES PRODUITS
      ======================= */
      achat.produits.forEach((p, index) => {
        x = startX;

        if (index % 2 === 0) {
          doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
            .fill("#f2f2f2").stroke();
        }

        [index + 1, p.nom, p.quantite].forEach((val, i) => {
          doc.rect(x, y, colWidths[i], rowHeight).stroke();
          doc.fillColor("#000000")
            .text(val.toString(), x + 5, y + 7, {
              width: colWidths[i] - 10,
              align: i === 0 ? "center" : "left",
            });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      /* =======================
         CACHET ENTREPRISE
      ======================= */

      y += 40; // laisser un espace avant le cachet
      doc.font("Helvetica").fontSize(12).text("Cachet et Signature :", startX, y);
      doc.text("_________________________", startX, y + 15);

      doc.end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: err.toString() });
    });
};


// Modifier un achat fournisseur

exports.modifierAchat = (req, res) => {
  AchatModel.modifierAchat(req.params.id, req.body)
    .then(({ message, achat }) => {
      console.log(message)
      res.json({ message, achat });
    })
    .catch(err => {
      console.log(err)
      res.status(400).json({ message: err });
    });
};



// Supprimer un achat fournisseur

exports.supprimerAchat = (req, res) => {
  const { id } = req.params;

  AchatModel.supprimerAchat(id)
    .then((message) => {
      res.json({ message });
    })
    .catch((err) => {
      res.status(400).json({ message: err });
    });
};



// Modifier l'état d'un Achat

exports.modifierEtatAchat = (req, res) => {
  const { id } = req.params;
  const { etat } = req.body;

  AchatModel.modifierEtatAchat(id, etat)
    .then(({ message, achat }) => {
      res.json({ message, achat });
    })
    .catch(err => {
      res.status(400).json({ message: err });
    });
};


// Récupérer tous les Achats par date

exports.filtrerParDate = (req, res) => {
  const { dateDebut, dateFin } = req.query;

  AchatModel.filtrerParDate(dateDebut, dateFin)
    .then((data) => res.json({ data }))
    .catch((err) =>
      res.status(400).json({ message: err })
    );
};