const calculateDistance = require('../utils/calculateDistance');
const calculateAmount = require('../utils/calculateAmount');
const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const TEST_PAYMENT_SECRET = process.env.TEST_PAYMENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const RETURN_URL = process.env.RETURN_URL;
const Transaction = require("../database/models/Transaction.model");
const axios = require("axios");
const Order = require("../database/models/order.model");
const calculateTripAmount = require("../utils/calculateAmount");
// const saveTransactionToDatabase =
//   (TransactionModule && TransactionModule.saveTransactionToDatabase) ||
//   (typeof TransactionModule === "function" ? TransactionModule : null);
exports.initializePayment = catchAsync(async (req, res, next) => {
  const { currency, phone_number, orderId } = req.body;
  const tx_ref = `tx_${orderId ? String(orderId) : Date.now()}`;
  // Validate request data
  if (!currency || !phone_number || !tx_ref || !orderId) {
    return next(new appError("Missing required fields", 400));
  }

  // Fetch order and calculate amount
  const order = await Order.findById(orderId);
  if (!order) return next(new appError('Order not found', 404));

  // Calculate distance (km) between pickup and delivery
  const distance = calculateDistance(
    order.pickupLocation.latitude,
    order.pickupLocation.longitude,
    order.deliveryLocation.latitude,
    order.deliveryLocation.longitude
  );
  // Get weight and discount
  const weight = order.cargo?.weightKg || 0;
  const discount = order.discount || 0;
  console.log(process.env.TEST_PAYMENT_SECRET);
  // Calculate amount using config
  const amount = await calculateTripAmount({ distance, weight, discount });

  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount,
        currency,
        phone_number,
        tx_ref,
        callback_url: process.env.CALLBACK_URL,
        return_url: `${process.env.RETURN_URL}?tx_ref=${tx_ref}&order_id=${orderId}`,
        customization: {
          title: "My Shop Payment",
          description: "Payment for order",
        },
        meta: {
          hide_receipt: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_PAYMENT_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('Chapa API error:', error.response?.data || error);
    let message = error.message;
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object') {
        message = JSON.stringify(error.response.data);
      } else {
        message = error.response.data;
      }
    }
    return next(new appError(message, error.response?.status || 500));
  }
});


exports.callBack = catchAsync(async (req, res, next) => {
  console.log("Payment Callback Request Body:", req.body);
  const { ref_id, tx_ref } = req.body;

  if (!tx_ref) {
    console.warn("[payment callback] missing tx_ref");
    return res.status(400).json({ status: "fail", message: "Missing tx_ref" });
  }
  const orderId = tx_ref.split("_")[1];
  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_PAYMENT_SECRET}`,
        },
      }
    );
    console.log("Chapa Verification Response:", response.data);
    if (response.data.status === "success") {
      // Store transaction details in your database
      await Transaction.saveTransactionToDatabase({ tx_ref, status: response.data.status, amount: response.data.data.amount, ref_id, orderId });
      await Order.findOneAndUpdate(
        { orderId: orderId },
        { paymentStatus: "paid" },
        { new: true }
      );
      res.status(200).json({ status: "success", message: "Webhook received" });
    } else {
      res.status(400).json({ status: "fail", message: "Transaction verification failed" });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
  // Acknowledge callback
  // res.status(200).json({ status: 'success', tx_ref });
});


exports.verifyPayment = catchAsync(async (req, res, next) => {
  const tx_ref =
    req.body?.tx_ref ||
    req.body?.tx_Ref ||
    req.query?.tx_ref ||
    req.params?.tx_ref;
  console.log("Payment Request Body:", req.body);

  if (!tx_ref) {
    return next(new appError("Missing required fields", 400));
  }
  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_PAYMENT_SECRET}`,
        },
      }
    );
    res.status(200).json({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return next(new appError(message, error.response?.status || 500));
  }
});
