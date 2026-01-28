const cloudinary = require("../config/cloudinary");

const deleteFromCloudinary = async (public_id) => {

  if (!public_id) return;
  
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

module.exports = deleteFromCloudinary;