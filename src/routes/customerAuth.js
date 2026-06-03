const express = require("express");
const auth = require("../middleware/auth");
const customerAuthController =
  require("../controllers/customerAuth.controller");

const router = express.Router();

router.post(
  "/register",
  customerAuthController.register
);

router.post(
  "/login",
  customerAuthController.login
);

router.get(
  "/me",
  auth.requireCustomer,
  customerAuthController.me
);

router.get(
  "/orders",
  auth.requireCustomer,
  customerAuthController.getMyOrders
);

module.exports = router;
