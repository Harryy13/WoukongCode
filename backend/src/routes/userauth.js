const ex=require('express');
const usrroute=ex.Router();
const {register,login,logout,adminRegister,delProfile}=require('../controller/userauthentication');
const userMiddleware=require('../middleware/usermiddle');
const adminMiddleware=require('../middleware/adminmiddle');


usrroute.post('/register',register);
usrroute.post('/login',login);
usrroute.post('/logout',userMiddleware,logout);
usrroute.post('/admin/register',adminMiddleware,adminRegister);
usrroute.delete('/delprofile',userMiddleware,delProfile);
usrroute.get('/check',userMiddleware,(req,res)=>{
    const repl={
        firstname:req.result.firstname,
        email:req.result.emailId,
        id:req.result._id,
        role:req.result.role
    };
    res.status(200).json({
        user:repl,
        message:"checked"
    })
});







module.exports=usrroute;


