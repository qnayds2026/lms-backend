const {
  createManualPayment,
  updatePaymentStatus,
  getMyPayments,
  getAllPayments,
  createRazorpayOrder,
  updateRazorpayPayment,
} = require("../services/payment.services");
const crypto = require("crypto");

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

const myPayments = async (req, res) => {
  try {
    const payments = await getMyPayments(req.user.id);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const allPayments = async (req, res) => {
  try {
    const payments = await getAllPayments();

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    const data = await createRazorpayOrder(req.user.id, courseId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString());

    const event = payload.event;

    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;

      await updateRazorpayPayment(paymentEntity.order_id, paymentEntity.id);
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details.",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    await updateRazorpayPayment(razorpay_order_id, razorpay_payment_id);

    return res.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createManual,
  updateStatus,
  myPayments,
  allPayments,
  createOrder,
  razorpayWebhook,
  verifyPayment,
};
