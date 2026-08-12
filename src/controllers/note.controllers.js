const {
  createModuleNote,
  getModuleNotes,
  updateModuleNote,
  deleteModuleNote,
} = require("../services/note.services");

const createNote = async (req, res) => {
  try {
    const note = await createModuleNote(
      req.params.moduleId,
      req.user.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Note created successfully.",
      data: note,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getNotes = async (req, res) => {
  try {
    const notes = await getModuleNotes(req.params.moduleId);

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const note = await updateModuleNote(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
    );

    return res.status(200).json({
      success: true,
      message: "Note updated successfully.",
      data: note,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    await deleteModuleNote(req.params.id, req.user.id, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};
