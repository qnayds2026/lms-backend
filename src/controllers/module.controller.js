const prisma = require("../lib/prisma.js");

// Create module (Instructor only)
const createModule = async (req, res) => {
  const { title, description, position, courseId } = req.body;

  if (!title || !courseId) {
    return res.status(400).json({ message: "title and courseId are required" });
  }

  const parsedCourseId = parseInt(courseId);
  if (isNaN(parsedCourseId)) {
    return res.status(400).json({ message: "courseId must be a valid number" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsedCourseId } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to manage modules for this course" });
    }

    const newModule = await prisma.courseModule.create({
      data: {
        title,
        description,
        position: position ? parseInt(position) : 0,
        courseId: parsedCourseId,
      },
    });

    res.status(201).json(newModule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all modules for a course
const getModulesByCourse = async (req, res) => {
  const { courseId } = req.params;
  const parsedCourseId = parseInt(courseId);
  if (isNaN(parsedCourseId)) {
    return res.status(400).json({ message: "courseId must be a valid number" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsedCourseId } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { position: "asc" },
      include: { recordings: { orderBy: { position: "asc" } } },
    });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update module (Instructor only)
const updateModule = async (req, res) => {
  const { id } = req.params;
  const { title, description, position } = req.body;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "id must be a valid number" });
  }

  try {
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: parsedId },
      include: { course: true }
    });

    if (!existingModule) return res.status(404).json({ message: "Module not found" });

    if (existingModule.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course module" });
    }

    const updated = await prisma.courseModule.update({
      where: { id: parsedId },
      data: {
        title: title !== undefined ? title : existingModule.title,
        description: description !== undefined ? description : existingModule.description,
        position: position !== undefined ? parseInt(position) : existingModule.position,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete module (Instructor only)
const deleteModule = async (req, res) => {
  const { id } = req.params;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "id must be a valid number" });
  }

  try {
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: parsedId },
      include: { course: true }
    });

    if (!existingModule) return res.status(404).json({ message: "Module not found" });

    if (existingModule.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course module" });
    }

    await prisma.courseModule.delete({ where: { id: parsedId } });
    res.json({ message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reorder modules within a course (Instructor only)
// Body: { courseId, orderedIds: [moduleId, moduleId, ...] } — new top-to-bottom order
const reorderModules = async (req, res) => {
  const { courseId, orderedIds } = req.body;

  if (!courseId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "courseId and a non-empty orderedIds array are required" });
  }

  const parsedCourseId = parseInt(courseId);
  if (isNaN(parsedCourseId)) {
    return res.status(400).json({ message: "courseId must be a valid number" });
  }

  const incomingIds = orderedIds.map((id) => parseInt(id));
  if (incomingIds.some((id) => isNaN(id))) {
    return res.status(400).json({ message: "orderedIds must all be valid numbers" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsedCourseId } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to manage modules for this course" });
    }

    const existingModules = await prisma.courseModule.findMany({
      where: { courseId: parsedCourseId },
      select: { id: true },
    });
    const existingIds = new Set(existingModules.map((m) => m.id));

    const invalidIds = incomingIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Some orderedIds do not belong to this course",
        invalidIds,
        courseId: parsedCourseId,
      });
    }

    const uniqueOrderedIds = [...new Set(incomingIds)];

    await prisma.$transaction(
      uniqueOrderedIds.map((id, index) =>
        prisma.courseModule.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    const updated = await prisma.courseModule.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { position: "asc" },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createModule, getModulesByCourse, updateModule, deleteModule, reorderModules };