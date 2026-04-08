// tripProof.service.js
const Trip = require('../database/models/trip.model');
const Order = require('../database/models/order.model');
const { sendSMS } = require('../services/afromessage.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Call this when trip is DELIVERED to send OTP to recipient
 * @param {Trip} trip
 */
async function handleProofOfDeliveryOtp(trip) {
  // Find order and recipient phone
  const order = await Order.findById(trip.orderId);
  if (!order || !order.deliveryLocation || !order.deliveryLocation.contactPhone) {
    throw new Error('Recipient phone not found');
  }
  const recipientPhone = order.deliveryLocation.contactPhone;
  await sendDeliveryOtp(trip, recipientPhone);
}

// Utility: Generate and send OTP to recipient
async function sendDeliveryOtp(trip, recipientPhone) {
  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  trip.deliveryOtp = { code, expiresAt, verified: false };
  await trip.save();
  
  // Send SMS
  await sendSMS({
    to: recipientPhone,
    message: `Your delivery OTP is: ${code}`
  });
}

module.exports = { handleProofOfDeliveryOtp, sendDeliveryOtp };