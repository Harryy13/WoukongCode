const ex=require('express');
const adminMiddleware=require('../middleware/adminmiddle');
const videoroute=ex.Router();
const {generateUploadSignature,saveVideoMetaData,deleteVideo}=require('../controller/videoSelection');

videoroute.get('/create/:problemId',adminMiddleware,generateUploadSignature);
videoroute.post('/save',adminMiddleware,saveVideoMetaData);
videoroute.delete('/delete/:problemId',adminMiddleware,deleteVideo);



module.exports=videoroute;