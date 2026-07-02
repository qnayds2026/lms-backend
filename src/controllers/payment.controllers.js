const {
  createManualPayment,
  updatePaymentStatus,
} = require("../services/payment.services");

const createManual = async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    const payment = await createManualPayment(req.user.id, courseId, amount);

    res.status(201).json({
      success: true,
      message: "Payment request created successfully",
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await updatePaymentStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createManual,
  updateStatus,
};
