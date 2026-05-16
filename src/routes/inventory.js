const express = require("express");

const router = express.Router();

const auth =
  require("../middleware/auth");

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
  auth,
  getInventory
);


/* =========================
MOVIMIENTOS INVENTARIO
========================= */

router.get(
  "/movements",
  auth,
  getInventoryMovements
);


module.exports = router;