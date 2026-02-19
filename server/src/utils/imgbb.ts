import axios from 'axios';
import FormData from 'form-data';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export const uploadToImgBB = async (imageBuffer: Buffer, fileName: string): Promise<string> => {
    if (!IMGBB_API_KEY) {
        throw new Error('IMGBB_API_KEY is not configured');
    }

    try {
        const formData = new FormData();
        // ImgBB accepts base64 string or binary. 
        // Sending buffer as base64 is often more reliable with axios without intricate stream handling.
        formData.append('image', imageBuffer.toString('base64'));
        // OR: formData.append('image', imageBuffer, { filename: fileName });

        // Official docs say 'image' parameter is required.
        // 'name' parameter is optional.

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders(),
        });

        if (response.data && response.data.data && response.data.data.url) {
            return response.data.data.url;
        } else {
            throw new Error('ImgBB response did not contain URL');
        }
    } catch (error: any) {
        console.error('Error uploading to ImgBB:', error.response?.data || error.message);
        throw new Error('Failed to upload image');
    }
};
