const problem = require('../models/problem');
const solutionvid = require('../models/solutionvid');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId=req.result._id;

        if (!problemId || !userId) {
            return res.status(400).json({ error: 'problemId and userId are required' });
        }

        const prob = await problem.findById(problemId);

        if (!prob) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const timestamp = Math.round(Date.now() / 1000);

        const publicId = `wukongcode-solution/${problemId}/${userId}_${timestamp}`;

        const uploadParams = {
            timestamp,
            public_id: publicId
        };

        const signature = cloudinary.utils.api_sign_request(
            uploadParams,
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            signature,
            timestamp,
            public_id: publicId,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
        });

    } catch (err) {
        console.error('Error generating signature:', err);

        res.status(500).json({
            error: 'Failed to generate signature'
        });
    }
};

const saveVideoMetaData = async (req, res) => {
    try {
        const {
            problemId,
            cloudinaryPublicId,
            cloudinaryUrl,
            secureUrl,
            duration
        } = req.body;

        const userId = req.result._id;

        if (!problemId || !cloudinaryPublicId || !secureUrl) {
            return res.status(400).json({ error: 'problemId, cloudinaryPublicId and secureUrl are required' });
        }

        
        const cloudinaryResource = await cloudinary.api.resource(
            cloudinaryPublicId,
            { resource_type: 'video' }
        );

        if (!cloudinaryResource) {
            return res.status(404).json({ error: 'video not found' });
        }

        const existingVideo = await solutionvid.findOne({
            problemId,
            userId,
            cloudinaryPublicId
        });

        if (existingVideo) {
            
            return res.status(409).json({ error: 'the video is already in db' });
        }

        const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
            resource_type: 'video',
            transformation: [
                { width: 400, height: 255, crop: 'fill' },
                { quality: 'auto' },
                { start_offset: 'auto' }
            ],
            format: 'jpg' 
        });

        const videosolution = new solutionvid({
            problemId,
            userId,
            cloudinaryPublicId,
            cloudinaryUrl,
            secureUrl,
            duration: cloudinaryResource.duration || duration,
            thumbnailUrl
        });

        
        await videosolution.save();

        res.status(201).json({
            message: 'video is saved successfully',
         
            videosolution: {
                id: videosolution._id,
                thumbnailUrl: videosolution.thumbnailUrl,
                duration: videosolution.duration,
                uploadedAt: videosolution.createdAt
            }
        });
    } catch (err) {
        console.error('error in saving the video ', err);
        res.status(500).json({ error: 'failed to save the video' });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const  {problemId } = req.params;

        if (!problemId) {
            console.log('sex');
            return res.status(400).json({ error: 'Problem id is required' });
        }

        const video = await solutionvid.findOneAndDelete({ problemId:problemId });
        console.log(problemId);
        

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });

        }

        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
            resource_type: 'video',
            invalidate: true
        });

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).json({ error: 'Failed to delete the video' });
    }
};

module.exports = {
    deleteVideo,
    saveVideoMetaData,
    generateUploadSignature
};