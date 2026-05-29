const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const upload = require("../config/multer");

router.post("/login",adminController.login);

router.get(
  "/store",
  auth,
  adminController.getStore
);

router.patch(
  "/store",
  auth,
  adminController.updateStore
);

router.post(
  "/store/logo",
  auth,
  upload.single("logo"),
  adminController.updateStoreLogo
);

router.post(
  "/store/hero",
  auth,
  upload.single("hero"),
  adminController.updateStoreHero
);

router.get(
  "/promotions",
  auth,
  adminController.getPromotions
);

router.post(
  "/promotions",
  auth,
  upload.single("image"),
  adminController.createPromotion
);

router.patch(
  "/promotions/:id",
  auth,
  upload.single("image"),
  adminController.updatePromotion
);

router.delete(
  "/promotions/:id",
  auth,
  adminController.deletePromotion
);

module.exports = router;
