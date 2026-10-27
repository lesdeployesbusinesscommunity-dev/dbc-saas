// ----------------------------------------------------------------------
// Le JUSTIFICATIF d'ACTIVITÉ joint à une demande d'inscription : un document
// qui prouve que la personne exerce bien le métier qu'elle déclare
// (attestation de travail, carte professionnelle, registre de commerce,
// patente, bulletin de salaire, facture récente...). Il se joint dans le
// formulaire public (Inscription/index.jsx) et se consulte dans le dossier
// (Admin/Inscriptions/DossierCV.jsx, et le dossier du leader d'antenne).
//
// En attendant le backend (qui recevra le fichier et renverra un lien), le
// document est gardé dans la demande sous forme de "data URL" :
//   { name, type, size, dataUrl }
// Les photos et scans sont réduits dans le navigateur (1 600 px au plus, JPEG)
// pour rester lisibles tout en pesant quelques centaines de Ko ; un PDF ne peut
// pas être réduit, d'où sa limite plus basse.

export const PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const PROOF_ACCEPT = PROOF_TYPES.join(",");
export const PROOF_MAX_PDF_MB = 1.5;
export const PROOF_MAX_IMAGE_MB = 10;

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const MB = 1024 * 1024;

// Rejette avec une Error dont le "code" dit pourquoi : "type", "size" ou "read".
function fail(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(fail("read"));
    reader.readAsDataURL(file);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(fail("read"));
    };
    image.src = url;
  });
}

// Taille réelle en octets d'une data URL base64.
const dataUrlBytes = (dataUrl) => {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

// Prépare le fichier choisi : renvoie { name, type, size, dataUrl } à ranger
// dans la demande.
export async function prepareProof(file) {
  if (!PROOF_TYPES.includes(file.type)) throw fail("type");

  if (file.type === "application/pdf") {
    if (file.size > PROOF_MAX_PDF_MB * MB) throw fail("size");
    const dataUrl = await readAsDataUrl(file);
    return { name: file.name, type: file.type, size: file.size, dataUrl };
  }

  if (file.size > PROOF_MAX_IMAGE_MB * MB) throw fail("size");
  const image = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (!width || !height) throw fail("read");

  const ratio = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) throw fail("read");
  // Fond blanc : un PNG transparent ne devient pas noir en JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { name: file.name, type: "image/jpeg", size: dataUrlBytes(dataUrl), dataUrl };
}

export const isImageProof = (proof) => Boolean(proof?.type?.startsWith("image/"));

// "245 Ko", "1,2 Mo".
export function formatFileSize(bytes, locale = "fr-FR") {
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} ${locale.startsWith("fr") ? "Ko" : "KB"}`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / MB)} ${locale.startsWith("fr") ? "Mo" : "MB"}`;
}

// Ouvre le document dans un nouvel onglet. Les navigateurs refusent d'ouvrir
// une "data URL" directement : on la convertit d'abord en fichier temporaire.
export async function openProof(proof) {
  const blob = await (await fetch(proof.dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadProof(proof) {
  const link = document.createElement("a");
  link.href = proof.dataUrl;
  link.download = proof.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
