const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a file to Cloudinary
const uploadToCloudinary = async (filePath, folder = "campus_recycle") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto", // handles images, videos, pdfs
    });

    // Remove local file after upload
    fs.unlinkSync(filePath);

    return result.secure_url; // return uploaded file URL
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

module.exports = { uploadToCloudinary };
