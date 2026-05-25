import nodemailer from "nodemailer";

function createTransporter() {
  const url = process.env.SMTP_URL || process.env.EMAIL_URL;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const service = process.env.EMAIL_SERVICE;
  const port = parseInt(
    process.env.SMTP_PORT || process.env.EMAIL_PORT || "587",
  );
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  if (url) {
    return nodemailer.createTransport(url);
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        process.env.SMTP_USER || process.env.EMAIL_USER
          ? {
              user: process.env.SMTP_USER || process.env.EMAIL_USER,
              pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
            }
          : undefined,
    });
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      "Email transport is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD or EMAIL_SERVICE/EMAIL_USER/EMAIL_PASSWORD.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function sendEmail(mailOptions) {
  const transporter = createTransporter();
  const from =
    process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER;

  return transporter.sendMail({
    from,
    ...mailOptions,
  });
}
