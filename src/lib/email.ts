import nodemailer from 'nodemailer';

function createTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    // Use Gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  // Fallback: Generic SMTP (SendGrid, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = createTransporter();
  const fromAddress = process.env.GMAIL_USER || process.env.SMTP_FROM || 'noreply@maharat-syria.com';

  try {
    const info = await transporter.sendMail({
      from: `"منصة مهاراتنا" <${fromAddress}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', {
      error: error instanceof Error ? error.message : String(error),
      to,
      subject,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}
