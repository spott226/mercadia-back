const User = require("../models/adminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req,res)=>{

  try{

    const { email, password } = req.body;

    const user = await User.getUserByEmail(email);

    if(!user){
      return res.status(401).json({error:"invalid credentials"});
    }

    const valid = await bcrypt.compare(password,user.password);

    if(!valid){
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
      store_id: user.store_id
    });

  }catch(err){

    console.error(err);
    res.status(500).json({error:"server error"});

  }

};