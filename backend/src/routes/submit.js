const ex=require('express');
const subrouter=ex.Router();
const userMiddleware=require('../middleware/usermiddle');
const {submitcode,runcode}=require('../controller/usersubmissions');


subrouter.post('/submit/:id',userMiddleware,submitcode);  
subrouter.post('/run/:id',userMiddleware,runcode);





module.exports=subrouter;




