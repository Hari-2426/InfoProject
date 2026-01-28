const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadToCloudinary = async (localFilePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      transformation: [
        {
          width: 400,
          height: 225,
          crop: "fill",
          gravity: "auto"
        },
        {
          quality: "auto:best",
          fetch_format: "auto"
        }
      ],
    });
    fs.unlinkSync(localFilePath);
    return {  
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (err) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload failed:", err.message);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

module.exports = uploadToCloudinary;