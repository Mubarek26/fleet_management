const sendEmail = async ({ email, subject, message }) => {
  // Placeholder mailer to keep auth routes loadable.
  // Replace with a real provider (e.g., nodemailer) for production.
  // eslint-disable-next-line no-console
  console.log("[email]", { to: email, subject, message });
  return true;
};

module.exports = sendEmail;
