const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createRazorpayOrder } = require("../services/payment.services");
const { sendActivationEmail } = require("../services/email.services");

const createLandingOrder = async (req, res) => {
  try {
    const { name, email, phone, courseId } = req.body;

    if (!name || !email || !phone || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and courseId are required.",
      });
    }

    // Check course
    const course = await prisma.course.findUnique({
      where: {
        id: Number(courseId),
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Check if user already exists
    let student = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (student) {
      // Only students can purchase through landing page
      if (student.role !== "STUDENT") {
        return res.status(400).json({
          success: false,
          message:
            "This email belongs to another account. Please use a student account.",
        });
      }

      // If inactive but token missing, regenerate it
      if (!student.isActive && !student.activationToken) {
        student = await prisma.user.update({
          where: {
            id: student.id,
          },
          data: {
            activationToken: crypto.randomBytes(32).toString("hex"),
            activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
    } else {
      // Create new inactive student
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      student = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "STUDENT",
          isActive: false,
          activationToken: crypto.randomBytes(32).toString("hex"),
          activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    // Check if student already has access to this course
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: Number(courseId),
        status: "ACTIVE",
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You already own this course.",
      });
    }

    // Reuse existing payment service
    const paymentData = await createRazorpayOrder(student.id, Number(courseId));

    return res.status(200).json({
      success: true,
      message: "Order created successfully.",
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          isActive: student.isActive,
        },
        order: paymentData.order,
        course: paymentData.course,
      },
    });
  } catch (error) {
    console.error("Landing Payment Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resendActivationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is already activated",
      });
    }

    let token = user.activationToken;

    if (
      !token ||
      !user.activationExpires ||
      user.activationExpires < new Date()
    ) {
      token = crypto.randomBytes(32).toString("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          activationToken: token,
          activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    await sendActivationEmail({
      name: user.name,
      email: user.email,
      token,
    });

    return res.status(200).json({
      success: true,
      message: "Activation email sent successfully.",
    });
  } catch (error) {
    console.error("Resend Activation Error:", error);

    console.error("Resend Activation Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLandingOrder,
  resendActivationEmail,
};
