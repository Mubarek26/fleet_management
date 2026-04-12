// driverWallet.js
// Handles driver wallet crediting and transaction linking after payment

const Transaction = require('../database/models/Transaction.model');
const Trip = require('../database/models/trip.model');


/**
 * Credits the driver's wallet and links the transaction to the trip after payment.
 * @param {Object} order - The order document
 * @param {number} amount - The total paid amount
 * @param {number} platformCommission - The platform commission
 * @param {number} driverCommissionRate - The driver's commission rate (e.g., 0.8 for 80% of company share)
 */
async function creditDriverWallet({ trx_ref }, order, amount, platformCommission, driverCommissionRate, { status }) {
  const trip = await Trip.findOne({ orderId: order._id });
  if (trip && !trip.driverWalletTransaction) {
    const companyShare = amount - platformCommission;
    const driverShare = companyShare * driverCommissionRate;
    // Update the existing transaction with driver commission
    const updatedTx = await Transaction.findOneAndUpdate(
      { trx_ref },
      {
        $set: {
          driverCommission: driverShare,
          companyShare: companyShare,
          ref_id: trip._id,
        }
      },
      { new: true }
    );
    if (updatedTx) {
      trip.driverWalletTransaction = updatedTx._id;
      await trip.save();
      // Optionally: update driver wallet balance here if you have such a field
      return updatedTx;
    }
  }
  return null;
}

module.exports = { creditDriverWallet };
