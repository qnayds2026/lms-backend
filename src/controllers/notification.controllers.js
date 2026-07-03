const {
  getMyNotifications,
  markAsRead,
} = require("../services/notification.services");

const myNotifications = async (req, res) => {
  try {
    const notifications = await getMyNotifications(req.user.id);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const readNotification = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  myNotifications,
  readNotification,
};
