import { URL } from 'node:url';
import emailTransporter from '../../config/emailTransporter';
import nodemailer from 'nodemailer';
import { User } from '@prisma/client';

interface EmailOptions extends nodemailer.SendMailOptions {
  template: string;
  context: Record<string, unknown>;
}

const FRONTEND_URL = process.env.FRONT_URL as string;
const VERIFY_EMAIL_ENDPOINT = '/account/verify';

async function sendVerifyEmail(to: string, token: string, user: User) {
  const verifyLink = new URL(VERIFY_EMAIL_ENDPOINT, FRONTEND_URL);
  verifyLink.searchParams.append('k', token);
  verifyLink.searchParams.append('e', Buffer.from(to).toString('base64'));
  await emailTransporter.sendMail({
    to,
    subject: 'Verify Your Email',
    template: 'verifyEmail',
    context: { verifyLink: verifyLink.toString() },
  } as EmailOptions);
}

export default sendVerifyEmail;
