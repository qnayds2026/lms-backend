const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../lib/prisma.js");
const { generateToken } = require("../utils/jwt.js");
const { sendResetPasswordEmail } = require("../utils/email.js");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (userData) => {
  const { name, email, phone, password, role } = userData;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const loginUser = async (userData) => {
  const { email, password } = userData;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error(
      "Your account has not been activated yet. Please check your email to activate your account.",
    );
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const getCurrentUserService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const activateAccount = async (token, password) => {
  if (!token || !password) {
    throw new Error("Token and password are required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const user = await prisma.user.findFirst({
    where: {
      activationToken: token,
    },
    select: {
      id: true,
      isActive: true,
      activationExpires: true,
    },
  });

  if (!user) {
    throw new Error("Invalid activation link.");
  }

  if (user.isActive) {
    throw new Error("Account is already activated.");
  }

  if (!user.activationExpires || user.activationExpires < new Date()) {
    throw new Error("Activation link has expired.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      isActive: true,
      activationToken: null,
      activationExpires: null,
    },
  });

  return {
    message: "Account activated successfully.",
  };
};

const forgotPasswordService = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Don't reveal whether the email exists — always resolve the same way
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

  await sendResetPasswordEmail(user.email, resetUrl);
};

const resetPasswordService = async (rawToken, newPassword) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
};

const googleLoginService = async (idToken) => {
  // Verify Google token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new Error("Google email is not verified");
  }

  // Find existing user by email
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Existing LOCAL account → Link Google account
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          provider: "GOOGLE",
          avatar: picture,
        },
      });
    }

    // Existing Google account → Update avatar if changed
    else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: picture,
        },
      });
    }
  } else {
    // First time Google login → Create account
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: null,
        role: "STUDENT",
        provider: "GOOGLE",
        googleId,
        avatar: picture,
        isActive: true,
      },
    });
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserService,
  activateAccount,
  forgotPasswordService,
  resetPasswordService,
  googleLoginService,
};
