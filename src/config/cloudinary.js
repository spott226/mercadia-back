const cloudinary = require("cloudinary").v2;

/* =========================
CONFIGURACIÓN CLOUDINARY
========================= */

cloudinary.config({
  cloud_name: "dztnrsw5l",
  api_key: "957324218615478",
  api_secret: "Y9FiZxvBIhdzcjh9AnY1HvLjL-I",
  secure: true
});

/* =========================
EXPORTAR CLOUDINARY
========================= */

module.exports = cloudinary;