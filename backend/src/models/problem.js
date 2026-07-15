const mongo=require('mongoose');
const {Schema}=mongo;


const problemschema= new Schema({

    title:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },

    difficulty:{
type:String,
enum:['easy','medium','hard'],
required:true

    },

    tags:{
        type:String,
        enum:['array','linkedlist','graph','dp','tree','queue','stack'],
        required:true
    }
    ,
    visibleTestCases:[
        {
            input:{
            type:String,
            required:true
        },
        output:{
         
            type:String,
            required:true
        },
        explanation:{
            type:String,
            required:true
        },

        }
    ]
    ,


    hiddenTestCases:[
        {
            input:{
            type:String,
            required:true
        },
        output:{
         
            type:String,
            required:true
        },
        

        }
    ]

    ,

    startCode:[
        {
            language:{
                  type:String,
            required:true
            },
            initialCode:{
                  type:String,
            required:true
            }
        }
    ]
,

problemcreator:{
    type:Schema.Types.ObjectId,
    ref:'user',
    required:true,
},

refrenceSolution:[{
    completecode:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true
    }
}]



},);


const problem=mongo.model('problem',problemschema);
module.exports=problem;