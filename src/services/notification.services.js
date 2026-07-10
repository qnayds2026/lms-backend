const prisma = require("../lib/prisma");

const createNotification = async (userId, title, message) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
    },
  });
};

const getMyNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: Number(notificationId),
      userId,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return await prisma.notification.update({
    where: {
      id: Number(notificationId),
    },
    data: {
      isRead: true,
    },
  });
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
};
