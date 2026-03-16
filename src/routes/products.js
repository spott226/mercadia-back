const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const auth = require("../middleware/auth");
const upload = require("../config/multer");

// catálogo público por tienda
router.get("/:store_id", productController.getProducts);

// operaciones del panel (requieren token)

// crear producto con imagen y variantes
router.post("/", auth, upload.any(), productController.createProduct);

// editar producto con imagen y variantes
router.put("/:id", auth, upload.any(), productController.updateProduct);

// eliminar producto
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;