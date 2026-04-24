const { Resend } = require("resend");

/**
 * Sends an email using the Resend service.
 * @param {Object} options - The email options.
 * @param {string} options.email - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.message - The body text of the email.
 */
const sendEmail = async (options) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        });

        if (error) {
            console.error("Resend Email sending error:", error);
            throw new Error(error.message);
        }

        console.log("Email sent successfully via Resend:", data);
        return data;
    } catch (err) {
        console.error("Resend service error:", err);
        throw err;
    }
};

module.exports = sendEmail;