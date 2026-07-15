const rclient=require('../config/redis');
const jwt=require('jsonwebtoken');
const user=require('../models/users');


const userMiddleware=async (req,res,next)=>{
    try{

const token = req.cookies?.token;
if (!token) throw new Error("No token");

   
  const payload=jwt.verify(token,process.env.JWT_SECRET);
  if(!payload._id || !payload.emailId){
    throw new Error('Invalid token');
  }

  const hasuser=await user.findOne({_id:payload._id,emailId:payload.emailId});
  if(!hasuser){
    throw new Error('User not found');
  }

    const check=await rclient.exists(`token${token}`);
    if(check){
      throw new Error('Token is blocked');
    }
    req.result=hasuser;

   next();


    }

    catch(err){
        res.status(401).json({error:err.message});
    }



}  

module.exports=userMiddleware;
