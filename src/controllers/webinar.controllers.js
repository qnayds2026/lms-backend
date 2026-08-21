const crypto = require("crypto");
const razorpay = require("../config/razorpay");

const WEBINAR_AMOUNT = 99 * 100; // ₹99

const createWebinarOrder = async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: WEBINAR_AMOUNT,
      currency: "INR",
      receipt: `webinar_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Webinar order creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create webinar payment order.",
    });
  }
};

const verifyWebinarPayment = async (req, res) => {
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

    // Fetch the payment from Razorpay to validate
    // amount and payment status.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment/order mismatch.",
      });
    }

    if (Number(payment.amount) !== WEBINAR_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    if (payment.currency !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment currency.",
      });
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webinar payment verified successfully.",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Webinar payment verification failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify webinar payment.",
    });
  }
};

module.exports = {
  createWebinarOrder,
  verifyWebinarPayment,
};
