import nodemailer from "nodemailer";

// Generic email sending function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // Configure your SMTP transport here
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `LegisEye <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || subject,
  });
}

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  await sendEmail({
    to,
    subject: "Verify your email address",
    html: `<p>Welcome! Please verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not sign up, please ignore this email.</p>`,
    text: `Welcome! Please verify your email by visiting: ${verificationUrl}`,
  });
}
