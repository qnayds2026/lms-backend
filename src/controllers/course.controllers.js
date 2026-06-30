const prisma = require("../lib/prisma");

// Create course (Instructor only)
const createCourse = async (req, res) => {
  const { title, description, thumbnail, price } = req.body;
  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail,
        price,
        instructorId: req.user.id,
      },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all published courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { instructor: { select: { id: true, name: true} } },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single course with modules
const getCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        modules: {
          orderBy: { position: "asc" },
          include: { recordings: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update course (Instructor only - own course)
const updateCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course" });
    }

    const updated = await prisma.course.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course" });
    }

    await prisma.course.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get instructor's own courses
const myCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: req.user.id },
      include: { _count: { select: { enrollments: true } } },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCourse, getAllCourses, getCourse, updateCourse, deleteCourse, myCourses };