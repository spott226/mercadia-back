const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/* =========================
CONFIGURAR STORAGE CLOUDINARY
========================= */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "mercadia/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image"
    };
  }
});

/* =========================
FILTRO DE ARCHIVOS
========================= */

function fileFilter(req, file, cb) {

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de imagen no permitido"), false);
  }

}

/* =========================
MULTER CONFIG
========================= */

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = upload;