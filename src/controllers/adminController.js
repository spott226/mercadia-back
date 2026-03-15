const User = require("../models/adminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req,res)=>{

  try{

    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    console.log("EMAIL RECIBIDO:", email);

    const user = await User.getUserByEmail(email);

    console.log("USER EN BD:", user);

    if(!user){
      console.log("NO SE ENCONTRO USUARIO");
      return res.status(401).json({error:"invalid credentials"});
    }

    console.log("PASSWORD ENVIADO:", password);
    console.log("HASH BD:", user.password);

    const valid = await bcrypt.compare(password,user.password);

    console.log("RESULTADO BCRYPT:", valid);

    if(!valid){
      console.log("PASSWORD NO COINCIDE");
      return res.status(401).json({error:"invalid credentials"});
    }

    const token = jwt.sign(
      {
        user_id:user.id,
        store_id:user.store_id
      },
      "MERCADIA_SECRET",
      { expiresIn:"1d" }
    );

    res.json({
      token,
      store_id:user.store_id
    });

  }catch(err){

    console.error("LOGIN ERROR:", err);
    res.status(500).json({error:"server error"});

  }

};