// src/services/emailService.js
import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter based on environment
   * @returns {Object} Nodemailer transporter
   */
  createTransporter() {
    // In production, use your preferred email service
    if (process.env.NODE_ENV === "production") {
      // Example for SendGrid configuration (requires API key)
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // For development and testing, use a test account or service like Mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send email using the configured transporter
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || "Beside App <noreply@besideapp.com>",
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${options.email}`);
      return result;
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Reset token
   * @param {string} userName - User name
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetURL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        <p>This link is valid for 10 minutes only.</p>
        <p>Best regards,<br/>The Beside App Team</p>
      </div>
    `;

    const text = `Hello ${userName},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n${resetURL}\n\nIf you didn't request this, please ignore this email and your password will remain unchanged.\nThis link is valid for 10 minutes only.\n\nBest regards,\nThe Beside App Team`;

    await this.sendEmail({
      email,
      subject: "Password Reset Request",
      html,
      text,
    });
  }

  /**
   * Send email verification email
   * @param {string} email - User email
   * @param {string} verificationToken - Verification token
   * @param {string} userName - User name
   */
  async sendVerificationEmail(email, verificationToken, userName) {
    const verificationURL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with Beside App. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">Verify Email</a>
        </div>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>This link is valid for 24 hours.</p>
        <p>Best regards,<br/>The Beside App Team</p>
      </div>
    `;

    const text = `Hello ${userName},\n\nThank you for registering with Beside App. Please verify your email address by clicking the link below:\n\n${verificationURL}\n\nIf you didn't create an account with us, please ignore this email.\nThis link is valid for 24 hours.\n\nBest regards,\nThe Beside App Team`;

    await this.sendEmail({
      email,
      subject: "Email Verification",
      html,
      text,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
