const nodeMailer = require("nodemailer");

const smtpPort = Number(process.env.SMTP_PORT || 465);
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASS;

const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE.toLowerCase() === "true"
        : smtpPort === 465,
    auth: emailUser && emailPassword
        ? { user: emailUser, pass: emailPassword }
        : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
});

const verifyEmailConnection = async () => {
    if (!emailUser || !emailPassword) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be configured to use email.");
    }
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
        throw new Error("SMTP_PORT must be a valid port number.");
    }

    await transporter.verify();
};

const sendOtpEmail = async (email, otp,type) => {
    try {
        const title = type ===  'account_verification' ? 'Account Verification' : 'Event Booking';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Eventra account:'
            : 'please use the following OTP to verify and confirm your event booking on Eventra:';
        const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject:title,
        html:  `
           <div style="font-family: Arial, sans-serif; text-align: center;">
            <h2 style="color: #333;">${title}</h2>
            <p style="font-size: 16px; color: #555;">${msg}</p>
            <p style="font-size: 24px; font-weight: bold; color: #007BFF;">${otp}</p>
            <p style="font-size: 13px; color: #777;">This code expires in 5 minutes.</p>
           </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email} for ${type}`);
    } catch (error) {
        console.error("Error sending OTP email:", error.message);
        throw error;
    }
};

const sendBookingEmail = async (email, userName, eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
            <h2>Hi ${userName},</h2>
            <p>Your booking for the event <strong>${eventTitle}</strong> has been confirmed.</p>
            <p>Thank you for choosing Eventra!</p>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
    } catch (error) {
        console.error('Error sending booking confirmation email:', error.message);
        throw error;
    }
};

module.exports = { sendBookingEmail, sendOtpEmail, verifyEmailConnection };