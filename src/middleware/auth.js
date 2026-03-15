const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "token required" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "invalid token format" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, "MERCADIA_SECRET");
    req.user = decoded; // { user_id, store_id }
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
};