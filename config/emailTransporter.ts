import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
const path = require('path');

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

emailTransporter.use(
  'compile',
  hbs({
    viewEngine: {
      extname: '.hbs',
      partialsDir: path.join(__dirname, '..', 'emails'),
      defaultLayout: false,
    },
    viewPath: path.join(__dirname, '..', 'emails'),
    extName: '.hbs',
  })
);

export default emailTransporter;
