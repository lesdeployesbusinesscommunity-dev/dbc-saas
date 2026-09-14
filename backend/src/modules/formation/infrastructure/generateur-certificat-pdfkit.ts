import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import { DonneesCertificatPdf, GenerateurCertificatPdfPort } from '../domaine/generateur-certificat-pdf.port';

@Injectable()
export class GenerateurCertificatPdfKit implements GenerateurCertificatPdfPort {
  async generer(donnees: DonneesCertificatPdf): Promise<Buffer> {
    const qrDataUrl = await QRCode.toDataURL(donnees.urlVerification, { margin: 1, width: 160 });
    const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const morceaux: Buffer[] = [];
      doc.on('data', (morceau: Buffer) => morceaux.push(morceau));
      doc.on('end', () => resolve(Buffer.concat(morceaux)));
      doc.on('error', reject);

      doc
        .fontSize(11)
        .fillColor('#94a3b8')
        .text('DÉPLOYÉS BUSINESS COMMUNITY', { align: 'center' });
      doc.moveDown(0.8);
      doc.fontSize(30).fillColor('#0f172a').text('Certificat de réussite', { align: 'center' });
      doc.moveDown(1.2);
      doc
        .fontSize(14)
        .fillColor('#334155')
        .text(`Décerné au membre matricule ${donnees.matricule}`, { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(20).fillColor('#e5a000').text(donnees.formationTitre, { align: 'center' });
      doc.moveDown(0.6);
      doc
        .fontSize(11)
        .fillColor('#64748b')
        .text(`Délivré le ${donnees.delivreLe.toLocaleDateString('fr-FR')}`, { align: 'center' });

      doc.image(qrImage, doc.page.width / 2 - 60, doc.y + 20, { width: 120 });
      doc.moveDown(9);
      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .text(`Code de vérification : ${donnees.codeVerification}`, { align: 'center' })
        .text(donnees.urlVerification, { align: 'center' });

      doc.end();
    });
  }
}
