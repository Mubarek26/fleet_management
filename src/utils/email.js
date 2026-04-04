
const nodemailer = require('nodemailer');




const sendEmail = async (options) => {
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const fromAddress =
        process.env.EMAIL_FROM ||
        `Unity Freight Services <${process.env.EMAIL_USERNAME}>`;

    const mailOptions = {
        from: fromAddress,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Email sending error:', {
            message: err.message,
            code: err.code,
            response: err.response,
            responseCode: err.responseCode,
            command: err.command,
        });
        throw err;
    }
};

module.exports = sendEmail;