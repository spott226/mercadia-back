const express = require("express");

const router = express.Router();

const auth =
  require("../middlewares/auth");

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
  auth,
  getOrders
);


/* =========================
ACTUALIZAR STATUS
========================= */

router.patch(
  "/:id/status",
  auth,
  updateOrderStatus
);


/* =========================
CANCELAR PEDIDO
========================= */

router.patch(
  "/:id/cancel",
  auth,
  cancelOrder
);


module.exports = router;