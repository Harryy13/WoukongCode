const ex=require('express');
const airouter=ex.Router();
const userMiddleware = require('../middleware/usermiddle');
const solveDoubt =require('../controller/solvedoubt');


airouter.post('/chat',userMiddleware,solveDoubt);

module.exports=airouter;
