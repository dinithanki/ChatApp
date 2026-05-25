import nodemailer from "nodemailer";

function normalizeCredential(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, "");
}

function normalizeEmail(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

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

  const emailUser = normalizeEmail(
    process.env.SMTP_USER || process.env.EMAIL_USER,
  );
  const emailPassword = normalizeCredential(
    process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
  );

  if (url) {
    return nodemailer.createTransport(url);
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: emailUser
        ? {
            user: emailUser,
            pass: emailPassword,
          }
        : undefined,
    });
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  if (!emailUser || !emailPassword) {
    throw new Error(
      "Email transport is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD or EMAIL_SERVICE/EMAIL_USER/EMAIL_PASSWORD.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
}

export async function sendEmail(mailOptions) {
  const transporter = createTransporter();
  const from = normalizeEmail(
    process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER,
  );

  return transporter.sendMail({
    from,
    ...mailOptions,
  });
}
