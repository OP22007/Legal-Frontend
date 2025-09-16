import nodemailer from "nodemailer";

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
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

  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `Legal Platform <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your email address",
    html: `<p>Welcome! Please verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not sign up, please ignore this email.</p>`,
  });
}
