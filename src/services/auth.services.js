const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma.js");
const { generateToken } = require("../utils/jwt.js");

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
    "Your account has not been activated yet. Please check your email to activate your account."
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

if (
  !user.activationExpires ||
  user.activationExpires < new Date()
) {
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

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserService,
  activateAccount,
};
