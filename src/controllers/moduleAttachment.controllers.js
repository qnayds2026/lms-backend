const {
  createAttachment,
  getAttachmentsByModule,
  deleteAttachment,
} = require("../services/moduleAttachment.service");

const create = async (req, res) => {
  try {
    const { moduleId, title, fileUrl, fileType } = req.body;

    const attachment = await createAttachment(
      moduleId,
      title,
      fileUrl,
      fileType,
    );

    res.status(201).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    res.status(400).json({
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
