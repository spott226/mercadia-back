const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dztnrsw5l",
  api_key: "957324218615478",
  api_secret: "Y9FiZxvBIhdzcjh9AnY1HvLjL-I"
});

module.exports = cloudinary;