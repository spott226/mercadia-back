const express = require("express");

const router = express.Router();

const {

  getInventory,

  getInventoryMovements

} = require(
  "../controllers/inventory.controller"
);


/* =========================
INVENTARIO ERP
========================= */

router.get(
  "/",
  getInventory
);


/* =========================
MOVIMIENTOS INVENTARIO
========================= */

router.get(
  "/movements",
  getInventoryMovements
);


module.exports = router;