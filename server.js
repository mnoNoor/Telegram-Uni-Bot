import express from "express";
import { createBot } from "./index.js";

// environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

console.log("🔧 Environment check:", {
  hasBOT_TOKEN: !!BOT_TOKEN,
  hasWEBHOOK_URL: !!WEBHOOK_URL,
  PORT: PORT,
});

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("❌ Missing required environment variables:");
  console.error("BOT_TOKEN:", BOT_TOKEN ? "✅ Set" : "❌ Missing");
  console.error("WEBHOOK_URL:", WEBHOOK_URL ? "✅ Set" : "❌ Missing");
  console.error(
    "Please set BOT_TOKEN and WEBHOOK_URL in Render environment variables"
  );
  process.exit(1);
}

// from index.js
const bot = createBot(BOT_TOKEN);

const app = express();
app.use(express.json());

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
  res.send("🤖 Bot is running via Webhook!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    webhook_url: `${WEBHOOK_URL}/webhook`,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Webhook URL: ${WEBHOOK_URL}/webhook`);

  try {
    const webhookUrl = `${WEBHOOK_URL}/webhook`;
    console.log(`🔄 Setting webhook to: ${webhookUrl}`);

    await bot.telegram.deleteWebhook();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await bot.telegram.setWebhook(webhookUrl);
    console.log("✅ Webhook set successfully!");

    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log("📋 Webhook Info:", JSON.stringify(webhookInfo, null, 2));
  } catch (err) {
    console.error("❌ Failed to set webhook:", err);
  }
});
