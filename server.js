import express from "express";
import { createBot } from "./index.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

console.log("🔧 Environment check:", {
  hasBOT_TOKEN: !!BOT_TOKEN,
  PORT: PORT,
});

if (!BOT_TOKEN) {
  console.error("❌ Missing BOT_TOKEN");
  process.exit(1);
}

const bot = createBot(BOT_TOKEN);
const app = express();
app.use(express.json());

let WEBHOOK_URL = process.env.WEBHOOK_URL;
if (!WEBHOOK_URL) {
  WEBHOOK_URL =
    process.env.RENDER_EXTERNAL_URL ||
    `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` ||
    `http://localhost:${PORT}`;
}

console.log("🌐 Detected Webhook URL:", WEBHOOK_URL);

// Webhook endpoint
app.post(`/webhook`, async (req, res) => {
  console.log("📨 Received webhook update");
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling update:", err);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Bot is running!</h1>
    <p>Webhook URL: ${WEBHOOK_URL}/webhook</p>
    <p><a href="/webhook-info">Check Webhook Info</a></p>
  `);
});

app.get("/webhook-info", async (req, res) => {
  try {
    const webhookInfo = await bot.telegram.getWebhookInfo();
    res.json({
      status: "success",
      detected_webhook_url: `${WEBHOOK_URL}/webhook`,
      telegram_webhook_info: webhookInfo,
      environment: {
        RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
        RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
        PORT: PORT,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
});

// webhook setup
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    const webhookUrl = `${WEBHOOK_URL}/webhook`;
    console.log(`🔄 Setting webhook to: ${webhookUrl}`);

    await bot.telegram.deleteWebhook();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await bot.telegram.setWebhook(webhookUrl);
    console.log("✅ Webhook set result:", result);

    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log("📋 Final Webhook Info:");
    console.log("- URL:", webhookInfo.url);
    console.log(
      "- Has Custom Certificate:",
      webhookInfo.has_custom_certificate
    );
    console.log("- Pending Updates:", webhookInfo.pending_update_count);
    console.log("- Last Error Date:", webhookInfo.last_error_date);
    console.log("- Last Error Message:", webhookInfo.last_error_message);
  } catch (err) {
    console.error("❌ Failed to set webhook:", err);
  }
});
