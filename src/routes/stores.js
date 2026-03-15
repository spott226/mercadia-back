const express = require("express");
const router = express.Router();

const storeController = require("../controllers/storeController");

router.get("/:slug", storeController.getStore);

router.get("/:slug/products", storeController.getStoreProducts);

module.exports = router;