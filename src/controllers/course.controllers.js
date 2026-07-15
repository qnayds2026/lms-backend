const prisma = require("../lib/prisma");

// Create course (Instructor only)
const createCourse = async (req, res) => {
  const { title, description, thumbnail, price } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "title is required" });
  }

  let parsedPrice = 0;
  if (price !== undefined) {
    parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res
        .status(400)
        .json({ message: "price must be a valid non-negative number" });
    }
  }

  try {
    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description,
        thumbnail,
        price: parsedPrice,
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
      include: { instructor: { select: { id: true, name: true } } },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStudentCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },

      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },

        enrollments: {
          where: {
            studentId: req.user.id,
          },

          select: {
            status: true,
          },
        },
      },
    });

    const formattedCourses = courses.map((course) => ({
      ...course,

      enrollmentStatus: course.enrollments[0]?.status || null,
    }));

    res.json(formattedCourses);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Get single course with modules
const getCourse = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "id must be a valid number" });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: parsedId },
      include: {
        instructor: { select: { id: true, name: true } },
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
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "id must be a valid number" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsedId } });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course" });
    }

    // Whitelist editable fields only — never trust req.body directly.
    // instructorId, id, createdAt, etc. can never be overwritten this way.
    const { title, description, thumbnail, price, isPublished } = req.body;
    const data = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "title cannot be empty" });
      }
      data.title = title.trim();
    }
    if (description !== undefined) data.description = description;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res
          .status(400)
          .json({ message: "price must be a valid non-negative number" });
      }
      data.price = parsedPrice;
    }
    // Only admins can toggle publish status directly here
    if (isPublished !== undefined) {
      if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ message: "Only admins can change publish status" });
      }
      data.isPublished = Boolean(isPublished);
    }

    const updated = await prisma.course.update({
      where: { id: parsedId },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete course (and everything that references it, to avoid foreign key
// constraint errors — recordings, modules, live classes, enrollments, then
// the course itself, in that dependency order)
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "id must be a valid number" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: parsedId } });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not your course" });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId: parsedId },
      select: { id: true },
    });
    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length > 0) {
      await prisma.recording.deleteMany({
        where: { moduleId: { in: moduleIds } },
      });
    }

    await prisma.courseModule.deleteMany({ where: { courseId: parsedId } });
    await prisma.liveClass.deleteMany({ where: { courseId: parsedId } });
    await prisma.enrollment.deleteMany({ where: { courseId: parsedId } });

    await prisma.course.delete({ where: { id: parsedId } });

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

module.exports = {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  myCourses,
  getStudentCourses,
};
