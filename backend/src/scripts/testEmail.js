import 'dotenv/config';
import nodemailer from 'nodemailer';

const testConnection = async () => {
  console.log('--- Email Diagnostics Tool ---');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '****** (configured)' : 'NOT CONFIGURED');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('------------------------------');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('Error: Missing SMTP settings in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // Bypasses SSL certificate issues
    }
  });

  console.log('Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');
    
    console.log('Attempting to send test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send to self
      subject: 'CRM Email Test Connection',
      text: 'If you see this, your Gmail SMTP connection is working perfectly!'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Connection failed!');
    console.error('Error Details:', error);
  }
};

testConnection();
