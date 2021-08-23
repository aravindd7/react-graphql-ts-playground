import nodemailer from "nodemailer";
import { environment as env } from '../../environment';

export async function sendEmail(to: string, subject: string, text?: string, html?: string) {

  // let testAccount = await nodemailer.createTestAccount();
  // console.log(testAccount);

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: env.ETHEREAL_MAILER_USERNAME,
      pass: env.ETHEREAL_MAILER_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: '"Fred Foo" <foo@example.com>',
    to: to,
    subject: subject,
    text: text,
    html: html, 
  });

  console.log("Message sent %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};