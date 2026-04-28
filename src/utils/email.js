const { Resend } = require("resend");

const sendEmail = async (options) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    });

    if (error) {
        console.error("Email sending error:", error);
        throw new Error(error.message);
    }

    console.log("Email sent successfully:", data);
    return data;
};

module.exports = sendEmail;