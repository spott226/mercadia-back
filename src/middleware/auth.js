const jwt = require("jsonwebtoken");
const { JWT_SECRET } =
  require("../config/auth");

function getTokenPayload(req, res){
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "token required" });
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "invalid token format" });
    return null;
  }

  const token = parts[1];

  try {
    return jwt.verify(
      token,
      JWT_SECRET
    );
  } catch (err) {
    res.status(401).json({ error: "invalid token" });
    return null;
  }
}

function authenticate(req, res, next) {
  const decoded =
    getTokenPayload(req, res);

  if(!decoded){
    return;
  }

  req.user = decoded;
  next();
}

function requireAdmin(req, res, next){
  const decoded =
    getTokenPayload(req, res);

  if(!decoded){
    return;
  }

  if(
    decoded.role &&
    decoded.role !== "admin"
  ){
    return res.status(403).json({
      error: "admin access required"
    });
  }

  req.user = decoded;
  next();
}

function requireCustomer(req, res, next){
  const decoded =
    getTokenPayload(req, res);

  if(!decoded){
    return;
  }

  if(decoded.role !== "customer"){
    return res.status(403).json({
      error: "customer access required"
    });
  }

  req.user = decoded;
  next();
}

module.exports = authenticate;
module.exports.requireAdmin = requireAdmin;
module.exports.requireCustomer = requireCustomer;
