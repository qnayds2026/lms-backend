const prisma = require("../lib/prisma");

// GET /api/admin/courses  (Admin only)
// Unlike the public /courses endpoint, this returns ALL courses regardless
// of publish status, plus instructor info and enrollment counts.
const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/instructors  (Admin only)
// Lists every INSTRUCTOR user with aggregate course/student counts.
// NOTE: assumes a reverse relation `courses` exists on the User model
// (the other side of Course.instructor). If your schema names it
// differently, rename `courses` below to match.
const getAllInstructors = async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        courses: {
          select: {
            id: true,
            isPublished: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const shaped = instructors.map((i) => {
      const totalStudents = i.courses.reduce(
        (sum, c) => sum + c._count.enrollments,
        0
      );
      return {
        id: i.id,
        name: i.name,
        email: i.email,
        joinedAt: i.createdAt,
        totalCourses: i.courses.length,
        publishedCourses: i.courses.filter((c) => c.isPublished).length,
        totalStudents,
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllCoursesAdmin, getAllInstructors };