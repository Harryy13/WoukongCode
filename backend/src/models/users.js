const mongoo=require('mongoose');
const {Schema}=mongoo;

const userSchema=new Schema({
    firstname:{
        type:String,
        minlength:3,
        maxlength:20,
        required:true
    },
    lastname:{
        type:String,
        maxlength:20,
        minlength:3,
        
    },

    emailId:{
        type:String,
        required:true,
        unique:true,
        immutable:true,
        lowercase:true,
        trim:true

    },
    password:{
        type:String,
        required:true
    }
    ,
    age:
     {
        type:Number,
        min:8,
        max:100
     },
   role:{
    type:String,
    enum:["admin","user"],
    default:"user",
}
,

problemSolved:{
    type:[
        {
            type:Schema.Types.ObjectId,
            ref:'problem'   
        }    
    ],  
    default:[],
    
}



},{timestamps:true});


userSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        const userId = doc._id;
        await mongo.model('Submission').deleteMany({ userId: userId });
    }
});


const User=mongoo.model('User',userSchema);
module.exports=User;