require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("src/uploads"));

/* =========================
   SERVIR IMÁGENES SUBIDAS
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   RUTAS API
========================= */
app.use("/api/store", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});