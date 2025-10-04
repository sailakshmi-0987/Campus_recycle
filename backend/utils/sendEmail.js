const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email options
        const mailOptions = {
            from: `Campus Recycle <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email Error:', error);
        return false;
    }
};

// Email verification template
const getVerificationEmailTemplate = (verificationCode, firstName) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .code { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Campus Recycle!</h1>
                </div>
                <div class="content">
                    <p>Hi ${firstName},</p>
                    <p>Thanks for joining Campus Recycle! Please verify your email address by entering this code:</p>
                    <div class="code">${verificationCode}</div>
                    <p>This code will expire in 24 hours.</p>
                    <p>If you didn't create an account, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2024 Campus Recycle. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// New message notification template
const getNewMessageEmailTemplate = (senderName, listingTitle, messagePreview) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f9fafb; }
                .message-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Message</h1>
                </div>
                <div class="content">
                    <p><strong>${senderName}</strong> sent you a message about:</p>
                    <p style="font-weight: bold;">${listingTitle}</p>
                    <div class="message-box">
                        <p>${messagePreview}</p>
                    </div>
                    <a href="${process.env.FRONTEND_URL}/messages" class="button">View Message</a>
                </div>
                <div class="footer">
                    <p>© 2024 Campus Recycle. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    sendEmail,
    getVerificationEmailTemplate,
    getNewMessageEmailTemplate
};