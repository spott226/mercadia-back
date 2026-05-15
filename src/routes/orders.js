const express = require("express");

const router = express.Router();

const {
  createOrder,
  confirmOrder
} = require("../controllers/orders.controller");


// =========================
// CREAR PEDIDO
// =========================

router.post("/", createOrder);


// =========================
// CONFIRMAR PEDIDO
// =========================

router.patch("/:id/confirm", confirmOrder);


module.exports = router;