const express = require("express");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Temporary demo storage.
// For production, replace this with Supabase/PostgreSQL.
const accounts = new Map();
const otpStore = new Map();

/* -----------------------------
   EMAIL CONFIGURATION
----------------------------- */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

/* -----------------------------
   HELPERS
----------------------------- */

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

/* -----------------------------
   SEND OTP
----------------------------- */

app.post("/api/send-otp", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (accounts.has(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email."
      });
    }

    const otp = createOtp();

    otpStore.set(normalizedEmail, {
      otp,
      name,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: role || "student",
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "TKSCT Student Portal - Email Verification",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>TKSCT Student Portal</h2>

          <p>Hello ${name},</p>

          <p>Your email verification OTP is:</p>

          <div style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            padding:20px;
            background:#e8f7ef;
            text-align:center;
          ">
            ${otp}
          </div>

          <p>This OTP expires in <b>5 minutes</b>.</p>

          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: "OTP sent successfully."
    });

  } catch (error) {
    console.error("OTP email error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send OTP. Check your email configuration."
    });
  }
});

/* -----------------------------
   VERIFY OTP / CREATE ACCOUNT
----------------------------- */

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const pending = otpStore.get(normalizedEmail);

  if (!pending) {
    return res.status(400).json({
      success: false,
      message: "OTP expired or not requested."
    });
  }

  if (Date.now() > pending.expiresAt) {
    otpStore.delete(normalizedEmail);

    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP."
    });
  }

  if (otp !== pending.otp) {
    return res.status(400).json({
      success: false,
      message: "Incorrect OTP."
    });
  }

  const account = {
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
    role: pending.role || "student",
    createdAt: new Date().toISOString()
  };

  accounts.set(normalizedEmail, account);
  otpStore.delete(normalizedEmail);

  res.json({
    success: true,
    message: "Account created successfully.",
    user: {
      name: account.name,
      email: account.email,
      role: account.role
    }
  });
});

/* -----------------------------
   LOGIN
----------------------------- */

app.post("/api/login", (req, res) => {
  const { email, password, role } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const account = accounts.get(normalizedEmail);

  if (!account) {
    return res.status(401).json({
      success: false,
      message: "No account found. Please create an account first."
    });
  }

  if (account.passwordHash !== hashPassword(password)) {
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password."
    });
  }

  if (account.role !== role) {
    return res.status(401).json({
      success: false,
      message: `This is a ${account.role} account.`
    });
  }

  res.json({
    success: true,
    user: {
      name: account.name,
      email: account.email,
      role: account.role
    }
  });
});

/* -----------------------------
   SERVER
----------------------------- */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TKSCT Portal running on http://localhost:${PORT}`);
  });
}

module.exports = app;