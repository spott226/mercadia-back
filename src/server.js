require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");   // ← agregar esto

const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");

const app = express();

/* =========================
CONFIGURACIÓN BÁSICA
========================= */

app.use(cors());
app.use(express.json());

/* =========================
SERVIR IMÁGENES
========================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ← agregar esto

/* =========================
RUTAS API
========================= */

app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

/* =========================
MANEJO DE ERRORES GLOBAL
========================= */

app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);
  res.status(500).json({
    error: "internal server error",
    detail: err.message
  });
});

/* =========================
SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});