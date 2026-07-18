const {
  createAttachment,
  getAttachmentsByModule,
  deleteAttachment,
} = require("../services/moduleAttachment.service");

const path = require("path");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const create = async (req, res) => {
  try {
    const { moduleId, title } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file.",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "lms/attachments",
      "raw",
    );

    const fileType = path
      .extname(req.file.originalname)
      .substring(1)
      .toLowerCase();

    const attachment = await createAttachment(
      moduleId,
      title,
      result.secure_url,
      fileType,
    );

    res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getByModule = async (req, res) => {
  try {
    const attachments = await getAttachmentsByModule(req.params.moduleId);

    res.status(200).json({
      success: true,
      count: attachments.length,
      data: attachments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await deleteAttachment(req.params.id);

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  getByModule,
  remove,
};
