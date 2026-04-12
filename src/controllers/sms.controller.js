// sms.controller.js
const express = require('express');
const router = express.Router();

const SmsLog = require('../database/models/smsLog.model');

// AfroMessage delivery callback endpoint (POST)
router.post('/sms/callback', async (req, res) => {
  // Upsert by message_id (from POST body)
  const messageId = req.body.message_id;
  await SmsLog.findOneAndUpdate(
    { 'payload.message_id': messageId },
    { receivedAt: new Date(), payload: req.body },
    { upsert: true, new: true }
  );
  res.status(200).json({ received: true });
});

// Allow GET for AfroMessage callback (production usage)
router.get('/sms/callback', async (req, res) => {
  // Upsert by message_id (from GET query)
  const messageId = req.query.message_id;
  await SmsLog.findOneAndUpdate(
    { 'payload.message_id': messageId },
    { receivedAt: new Date(), payload: req.query },
    { upsert: true, new: true }
  );
  console.log('AfroMessage callback received (GET):', req.query);
  res.status(200).json({ received: true, query: req.query });
});

module.exports = router;