import emailTransporter from '../config/emailTransporter';

async function sendEmail(to: string, subject: string, html: string) {
  await emailTransporter.sendMail({
    to,
    subject,
    html,
  });
}

export default sendEmail;
