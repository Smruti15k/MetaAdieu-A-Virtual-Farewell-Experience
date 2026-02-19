import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadVideoToCloudinary = async (fileBuffer: Buffer, fileName: string): Promise<string> => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary credentials are not configured');
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'video',
                folder: 'metaadieu/videos',
                public_id: `video_${Date.now()}`,
                // Free tier friendly settings
                transformation: [
                    { quality: 'auto', fetch_format: 'mp4' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    reject(new Error('Failed to upload video to Cloudinary'));
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Cloudinary returned no result'));
                }
            }
        );

        // Write the buffer to the upload stream
        uploadStream.end(fileBuffer);
    });
};

export default cloudinary;
