import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: (process.env.SMTP_PORT === '465'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'EcoSpark Hub'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('❌ Email sending failed:', error);
    // don't throw to avoid crashing the whole process
    return null;
  }
};
