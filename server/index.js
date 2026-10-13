const dotenv = require("dotenv");
dotenv.config();

const dns = require("node:dns");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.js");
const eventRoutes = require("./routes/events.js");
const bookingRoutes = require("./routes/booking.js");
const { verifyEmailConnection } = require("./utils/email.js");

const app = express();
let smtpConnected = false;
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
    smtp: smtpConnected ? "connected" : "disconnected",
  });
});

const clientBuildPath = path.resolve(__dirname, "../clients/dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientBuildPath, "index.html"), { dotfiles: "allow" }, (error) => {
      if (error) next(error);
    });
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Eventra API is running.", health: "/api/health" });
  });
}

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

const redactCredentials = (message) => {
  let safeMessage = String(message);
  for (const secret of [
    process.env.EMAIL_PASS,
    process.env.EMAIL_USER,
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.JWT_SECRET,
  ]) {
    if (secret) safeMessage = safeMessage.replaceAll(secret, "[redacted]");
  }
  return safeMessage;
};

const resolveMongoSrv = async (mongoUri) => {
  if (!mongoUri.startsWith("mongodb+srv://")) return;

  const hostname = new URL(mongoUri).hostname;
  const srvRecord = `_mongodb._tcp.${hostname}`;

  try {
    await dns.promises.resolveSrv(srvRecord);
  } catch (systemDnsError) {
    const fallbackDnsServers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,8.8.4.4")
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    try {
      dns.setServers(fallbackDnsServers);
      await dns.promises.resolveSrv(srvRecord);
      console.log("Configured fallback DNS servers for MongoDB Atlas SRV resolution.");
    } catch (fallbackDnsError) {
      throw new Error(
        `MongoDB DNS lookup failed (system: ${systemDnsError.code || systemDnsError.name}; fallback: ${fallbackDnsError.code || fallbackDnsError.name}).`
      );
    }
  }
};

const startServer = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Set MONGODB_URI in environment variables before starting the API.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("Set JWT_SECRET in environment variables before starting the API.");
  }

  await resolveMongoSrv(mongoUri);
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await verifyEmailConnection();
      smtpConnected = true;
      console.log("SMTP connection verified");
    } else {
      console.warn("EMAIL_USER or EMAIL_PASS not configured. Email notifications and OTP verification will be inactive until credentials are provided.");
    }
  } catch (emailError) {
    console.warn(`SMTP connection verification failed: ${emailError.message}. Proceeding without active email service.`);
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number.");
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer().catch(async (error) => {
  console.error(`Server startup failed: ${redactCredentials(error.message)}`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
