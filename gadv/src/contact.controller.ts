import { Controller, Post, Body } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// For security, set EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS in your .env file
// EMAIL_HOST=mail.yourdomain.com
// EMAIL_PORT=465
// EMAIL_USER=contact@yourdomain.com
// EMAIL_PASS=your_password

@Controller('api/contact')
export class ContactController {
  @Post()
  async handleContact(@Body() body: { name: string; email: string; phone: string; message: string }) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_PORT === '465' || process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true,
    });

    const subject = 'Nouveau message de contact / رسالة تواصل جديدة';
    const text =
      `--- FRANÇAIS ---\n` +
      `Nom: ${body.name}\n` +
      `Email: ${body.email}\n` +
      `Téléphone: ${body.phone}\n` +
      `Message:\n${body.message}\n\n` +
      `--- العربية ---\n` +
      `الاسم: ${body.name}\n` +
      `البريد الإلكتروني: ${body.email}\n` +
      `رقم الهاتف: ${body.phone}\n` +
      `الرسالة:\n${body.message}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject,
      text,
      replyTo: body.email,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Message envoyé avec succès.' };
    } catch (error) {
      console.error('Erreur envoi email contact:', error);
      return { success: false, message: "Erreur lors de l'envoi du message." };
    }
  }
} 