const prisma = require("../lib/prisma.js");

// Create module (Instructor only)
const createModule = async (req, res) => {
  const { title, description, position, courseId } = req.body;
  
  if (!title || !courseId) {
    return res.status(400).json({ message: "title and courseId are required" });
  }

  try {
    // Verify course ownership
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to manage modules for this course" });
    }

    const module = await prisma.courseModule.create({
      data: {
        title,
        description,
        position: position ? parseInt(position) : 0,
        courseId: parseInt(courseId),
      },
    });

    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all modules for a course
const getModulesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const modules = await prisma.courseModule.findMany({
      where: { courseId: parseInt(courseId) },
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
  try {
    const module = await prisma.courseModule.findUnique({
      where: { id: parseInt(id) },
      include: { course: true }
    });
    
    if (!module) return res.status(404).json({ message: "Module not found" });

    // Verify course ownership
    if (module.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course module" });
    }

    const updated = await prisma.courseModule.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : module.title,
        description: description !== undefined ? description : module.description,
        position: position !== undefined ? parseInt(position) : module.position,
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
  try {
    const module = await prisma.courseModule.findUnique({
      where: { id: parseInt(id) },
      include: { course: true }
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

    // Verify course ownership
    if (module.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course module" });
    }

    await prisma.courseModule.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createModule, getModulesByCourse, updateModule, deleteModule };
