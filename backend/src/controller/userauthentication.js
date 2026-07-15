const user=require('../models/users');
const valid=require('../utils/validate');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const rclient=require('../config/redis');
const submissionSchema=require('../models/submissions');



///////////////////// register///////////////////////////////////
const register=async(req,res)=>{
 
    console.log(req.body);
    try{
         valid(req.body );
         const salt=await bcrypt.genSalt(10);
         req.body.password=await bcrypt.hash(req.body.password,salt);
         req.body.role='user';



         const newuser=await user.create(req.body);
       const token=  jwt.sign({_id:newuser._id,emailId:newuser.emailId,role:'user'},process.env.JWT_SECRET,{expiresIn:'1h'});

       res.cookie('token',token,{httpOnly:true,secure:true,sameSite:'strict',maxAge:3600000});

       const result={
    firstname:newuser.firstname,
    email:newuser.emailId,
    id:newuser._id,
    role:newuser.role
};

       res.status(201).json({message:'User registered successfully',user:result});

    }
    catch(err){
        console.log(err.message);
        res.status(400).json({error:err.message});
    }
 
     }

     //////////////////////////////loginnn//////////////////////////////


     const login=async(req,res)=>{

          try{

            console.log("Login route hit");
    console.log(req.body);


                const {emailId,password}=req.body ;
                if(!emailId || !password){
                    throw new Error('invalid credentials');
                }
                else{
                    const hasuser=await user.findOne({emailId});
                    if(!hasuser){
                        throw new Error('User not found');
                    }
                    console.log(hasuser.password);


                    const matchpass= await bcrypt.compare(req.body.password,hasuser.password);
                    console.log(matchpass);

                    
if(!matchpass){
    throw new Error('Invalid credentials');
}

                    const token=jwt.sign({_id:hasuser._id,emailId:hasuser.emailId,role:hasuser.role},process.env.JWT_SECRET,{expiresIn:'1h'});
                    res.cookie('token',token,{httpOnly:true,secure:true,sameSite:'strict',maxAge:3600000});
const result={
    firstname:hasuser.firstname,
    email:hasuser.emailId,
    id:hasuser._id,
    role:hasuser.role
};

                    res.status(200).json({message:'User logged in successfully',user:result});



                }
          }
           catch(err){
                  res.status(400).json({error:err.message});
           }

     }

/////////////////////////// logout///////////////////////////////////////////

     const logout=async (req,res)=>{

        try{
             
            const payload = jwt.decode(req.cookies?.token);
            if (!payload) {
                throw new Error('Invalid token');
            }

await rclient.set(`token${req.cookies.token}`, 'blocked');
await rclient.expireAt(`token${req.cookies.token}`, payload.exp);

res.cookie('token',null,{expires:new Date(Date.now())});

res.status(200).json({message:'User logged out successfully'});







        }
        
        catch(err){
            res.status(5000).json({error:err.message});
        }



     }

////////////////////// admin register/////////////////////////////////////
     const adminRegister=async(req,res)=>{

 try{
         valid(req.body );
         const salt=await bcrypt.genSalt(10);
         req.body.password=await bcrypt.hash(req.body.password,salt);
         


         const newuser=await user.create(req.body);
       const token=  jwt.sign({_id:newuser._id,emailId:newuser.emailId,role:newuser.role},process.env.JWT_SECRET,{expiresIn:'1h'});

       res.cookie('token',token,{httpOnly:true,secure:true,sameSite:'strict',maxAge:3600000});
       res.status(201).json({message:'User registered successfully',user:newuser});

    }
    catch(err){
        res.status(400).json({error:err.message});
    }

     }

//////////// del profile///////////////////////////
const delProfile=async(req,res)=>{

    try{
        const userId = req.user._id;
        await user.findByIdAndDelete(userId);
      //  await submissionSchema.deleteMany({ userId: userId });
        res.status(200).json({ message: 'User profile and submissions deleted successfully' });


        
        

    }
    catch(err){
        res.status(500).json({error:err.message});
    }

}


   /////////////// export /////////////////////////////////////////


     module.exports={register,login,logout,adminRegister,delProfile};
