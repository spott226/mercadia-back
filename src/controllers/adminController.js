const User = require("../models/adminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {

  try {

    // limpiar email para evitar espacios o mayúsculas
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    // buscar usuario
    const user = await User.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "invalid credentials"
      });
    }

    // comparar contraseña con bcrypt
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "invalid credentials"
      });
    }

    // generar token
    const token = jwt.sign(
      {
        user_id: user.id,
        store_id: user.store_id
      },
      "MERCADIA_SECRET",
      {
        expiresIn: "1d"
      }
    );

    // respuesta
    res.json({
      token: token,
      store_id: user.store_id
    });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      error: "server error"
    });

  }

};