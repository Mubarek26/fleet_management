const Notification = require('../database/models/notification.model');
const socketUtils = require('../utils/socket');

/**
 * Send a notification to a specific user
 * @param {Object} data 
 * @param {string} data.recipient - User ID
 * @param {string} data.title 
 * @param {string} data.message 
 * @param {string} data.type 
 * @param {Object} data.metadata 
 */
exports.sendNotification = async (data) => {
  try {
    // 1. Save to database
    const notification = await Notification.create(data);

    // 2. Emit via socket
    const io = socketUtils.getIO();
    if (io) {
      const recipientId = data.recipient.toString();
      const roomName = `user_${recipientId}`;
      console.log(`[Notification] Attempting to emit to room: ${roomName}`);
      
      io.to(roomName).emit('notification', notification);
      console.log(`[Notification] Emitted successfully to ${roomName}`);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Error:', error);
  }
};

/**
 * Send notification to all admins of a company
 */
exports.notifyCompanyAdmins = async (companyId, notificationData) => {
  const User = require('../database/models/user.model');
  
  // Find all admins for this company
  const admins = await User.find({
    companyId: companyId,
    role: 'COMPANY_ADMIN',
    active: true
  });

  for (const admin of admins) {
    await this.sendNotification({
      ...notificationData,
      recipient: admin._id
    });
  }
};
