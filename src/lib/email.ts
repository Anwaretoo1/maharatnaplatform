import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    // Verify transporter
    const verified = await transporter.verify();
    console.log('Email transporter verified:', verified);

    if (!verified) {
      console.error('Email transporter verification failed');
      return false;
    }

    const info = await transporter.sendMail({
      from: `"منصة مهاراتنا" <${process.env.SMTP_FROM || 'noreply@maharat-syria.com'}>`,
      to,
      subject,
      html,
    });
    
    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", {
      error: error instanceof Error ? error.message : String(error),
      to,
      subject,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}
