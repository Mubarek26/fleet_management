// afromessage.service.js
// Service for sending SMS using AfroMessage API
const axios = require('axios');
require('dotenv').config();
const AFROMESSAGE_API_URL = process.env.AFROMESSAGE_API_URL || 'https://api.afromessage.com/api/send';
const AFROMESSAGE_IDENTIFIER_ID = process.env.AFROMESSAGE_IDENTIFIER_ID;
const AFROMESSAGE_CALLBACK = process.env.AFROMESSAGE_CALLBACK || '';

async function sendSMS({ to, message }) {
  if (!AFROMESSAGE_IDENTIFIER_ID) {
    throw new Error('AfroMessage IDENTIFIER_ID not set');
  }

  try {
    const params = {
      from: AFROMESSAGE_IDENTIFIER_ID,
      to,
      message,
    };

    if (AFROMESSAGE_CALLBACK) {
      params.callback = AFROMESSAGE_CALLBACK;
    }

    const res = await axios.get(AFROMESSAGE_API_URL, {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AFROMESSAGE_TOKEN}`, // ✅ THIS is required
      },
    });
    //   console.log('AfroMessage response:', res.data);
    return res.data;
  } catch (err) {
    console.error(err.response?.data || err.message);
    throw new Error('Failed to send SMS: ' + err.message);
  }
}

module.exports = { sendSMS };