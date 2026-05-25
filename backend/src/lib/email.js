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
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  // 1. Resend HTTP API (Recommended for Render / Vercel bypass)
  if (resendApiKey) {
    console.log("📨 Sending email via Resend HTTP API...");
    const from = normalizeEmail(
      process.env.EMAIL_FROM || process.env.SMTP_FROM || "onboarding@resend.dev"
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend HTTP API failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    console.log("✅ Email sent successfully via Resend HTTP API.");
    return data;
  }

  // 2. SendGrid HTTP API
  if (sendgridApiKey) {
    console.log("📨 Sending email via SendGrid HTTP API...");
    const from = normalizeEmail(
      process.env.EMAIL_FROM || process.env.SMTP_FROM || "no-reply@example.com"
    );

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: mailOptions.to }] }],
        from: { email: from },
        subject: mailOptions.subject,
        content: [{ type: "text/html", value: mailOptions.html }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SendGrid HTTP API failed: ${response.status} ${errText}`);
    }

    console.log("✅ Email sent successfully via SendGrid HTTP API.");
    return { success: true };
  }

  // 3. Fallback to standard Nodemailer SMTP
  console.log("📨 Attempting to send email via SMTP (Nodemailer)...");
  const transporter = createTransporter();
  const from = normalizeEmail(
    process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER,
  );

  try {
    const info = await transporter.sendMail({
      from,
      ...mailOptions,
    });
    console.log("✅ Email sent successfully via SMTP.");
    return info;
  } catch (error) {
    console.error("❌ Email sending failed via SMTP (Nodemailer)!");
    if (process.env.RENDER || process.env.NODE_ENV === "production") {
      console.error(
        "\n💡 DIAGNOSIS:\n" +
        "It looks like you are running on Render's free tier or in a restricted cloud environment.\n" +
        "Render blocks outgoing SMTP ports (25, 465, and 587) on all free services to prevent spam.\n" +
        "Therefore, traditional SMTP email services (like Gmail) will TIMEOUT and FAIL.\n\n" +
        "🚀 RESOLUTION:\n" +
        "To fix this, sign up for a free Resend account (resend.com) or SendGrid account (sendgrid.com),\n" +
        "and set one of these environment variables on your Render dashboard:\n" +
        "  - RESEND_API_KEY\n" +
        "  - SENDGRID_API_KEY\n\n" +
        "This will automatically switch the backend to use an HTTP-based email API (port 443) which is not blocked!"
      );
    }
    throw error;
  }
}
