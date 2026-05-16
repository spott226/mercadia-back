const express = require("express");

const router = express.Router();

const {

  createOrder,

  getOrders,

  updateOrderStatus,

  cancelOrder

} = require("../controllers/orders.controller");


/* =========================
CREAR PEDIDO
========================= */

router.post(
  "/",
  createOrder
);


/* =========================
LISTAR PEDIDOS ERP
========================= */

router.get(
  "/",
  getOrders
);


/* =========================
ACTUALIZAR STATUS
========================= */

router.patch(
  "/:id/status",
  updateOrderStatus
);


/* =========================
CANCELAR PEDIDO
========================= */

router.patch(
  "/:id/cancel",
  cancelOrder
);


module.exports = router;