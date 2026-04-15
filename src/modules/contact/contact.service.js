import { ContactModel } from "../../DB/index.js";
import nodemailer from "nodemailer";
import { createModuleRecord } from "../shared/module.shared.js";

export const sendMessage = async ({ userId, email, message }) => {

  //  save in DB
  const contact = await createModuleRecord(ContactModel, {
    userId,
    email,
    message,
  });

  //  send email to YOU
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: email, 
    to: process.env.SMTP_USER, 
    subject: "New Contact Message",
    text: message
  });

  return contact;
};
