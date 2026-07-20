const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (
  filePath,
  originalName,
  folder = "lms/attachments",
) => {
  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
    format: "pdf",
    use_filename: true,
    unique_filename: false,
  });
};

module.exports = uploadToCloudinary;
