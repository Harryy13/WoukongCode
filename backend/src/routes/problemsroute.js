const problem=require('../models/problem');
const express=require('express');
const probrouter=express.Router();
const adminMiddleware=require('../middleware/adminmiddle');
const {createproblem,updateProblem, deleteProblem,getProblemById,getAllProblems,problemSolvedByUser,submitproblem}=require('../controller/problemcontroller');
const userMiddleware=require('../middleware/usermiddle');












probrouter.post('/create', adminMiddleware, createproblem);
probrouter.put('/update/:id', adminMiddleware, updateProblem);
probrouter.delete('/delete/:id', adminMiddleware, deleteProblem);

probrouter.get('/problemById/:id', userMiddleware, getProblemById);
probrouter.get('/allproblems', userMiddleware, getAllProblems);
probrouter.get('/problemSolvedByUser', userMiddleware, problemSolvedByUser);
probrouter.get('/submitproblem/:pid',userMiddleware,submitproblem);






module.exports=probrouter;




