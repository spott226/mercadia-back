require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");
const orderRoutes = require("./routes/orders");

const app = express();


/* =========================
CONFIGURACIÓN BÁSICA
========================= */

app.use(cors());

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true
}));


/* =========================
SERVIR IMÁGENES
========================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


/* =========================
RUTAS API
========================= */

app.use("/api/stores", storeRoutes);

app.use("/api/products", productRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/orders", orderRoutes);


/* =========================
RUTA TEST
========================= */

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "Mercadia ERP Backend funcionando"
  });

});


/* =========================
404 API
========================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    error: "Ruta no encontrada"
  });

});


/* =========================
MANEJO GLOBAL ERRORES
========================= */

app.use((err, req, res, next) => {

  console.error("❌ ERROR:", err);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    detail: err.message
  });

});


/* =========================
SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`
🚀 Mercadia ERP Backend iniciado
🌐 Puerto: ${PORT}
`);

});