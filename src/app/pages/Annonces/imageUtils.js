// ----------------------------------------------------------------------
// Les IMAGES d'une annonce. En attendant le backend (qui recevra les fichiers
// et renverra des liens), chaque image est réduite dans le navigateur — 1 280 px
// au plus sur le grand côté, JPEG — puis gardée dans l'annonce sous forme de
// "data URL". Une photo de téléphone de 5 Mo tient ainsi dans 100 à 250 Ko, ce
// qui laisse la place à plusieurs annonces illustrées dans le stockage du
// navigateur.

export const MAX_IMAGES = 4;
export const MAX_SOURCE_MB = 10;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

const MAX_SIDE = 1280;
const QUALITY = 0.82;

// Rejette avec une Error dont le "code" dit pourquoi : "type", "size" ou "read".
function fail(code) {
  const error = new Error(code);
  error.code = code;
  return error;
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

// Prépare un fichier choisi par l'utilisateur : renvoie la "data URL" (JPEG
// réduit) à ranger dans l'annonce.
export async function prepareImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw fail("type");
  if (file.size > MAX_SOURCE_MB * 1024 * 1024) throw fail("size");

  const image = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (!width || !height) throw fail("read");

  const ratio = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const context = canvas.getContext("2d");
  if (!context) throw fail("read");
  // Fond blanc : les PNG / WebP transparents ne deviennent pas noirs en JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", QUALITY);
}
