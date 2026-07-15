const mongo = require('mongoose');

const VideoSchema = new mongo.Schema({
    problemId: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    userId: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'user',
        required: true // FIX: was the string "true" instead of boolean true — worked by accident (any non-empty string is truthy) but was incorrect
    },
    cloudinaryPublicId: {
        type: String,
        required: true,
        unique: true
    },
   
    cloudinaryUrl: {
        type: String
    },
    secureUrl: {
        type: String,
        required: true
    },
    
    thumbnailUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
    },

}, { timestamps: true });

module.exports = mongo.model('solutionvideo', VideoSchema);