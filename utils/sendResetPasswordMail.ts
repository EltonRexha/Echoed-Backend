import { URL } from 'node:url';
import emailTransporter from '../config/emailTransporter';
import nodemailer from 'nodemailer';

interface EmailOptions extends nodemailer.SendMailOptions {
  template: string;
  context: Record<string, unknown>;
}

const FRONTEND_URL = process.env.FRONT_URL as string;
const RESET_PASSWORD_ENDPOINT = '/account/reset-password';

async function sendResetPasswordEmail(to: string, token: string) {
  const resetLink = new URL(RESET_PASSWORD_ENDPOINT, FRONTEND_URL);
  resetLink.searchParams.append('k', token);
  await emailTransporter.sendMail({
    to,
    subject: 'Reset your password',
    template: 'resetPasswordEmail',
    context: { resetLink: resetLink.toString() },
  } as EmailOptions);
}

export default sendResetPasswordEmail;
