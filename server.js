import express from "express";
import { createBot } from "./index.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN");
  process.exit(1);
}

const bot = createBot(BOT_TOKEN);
const app = express();
app.use(express.json());

const WEBHOOK_BASE = process.env.RENDER_EXTERNAL_URL;
const WEBHOOK_URL = `${WEBHOOK_BASE}/webhook`;

app.post(`/webhook`, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling update:", err);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "Bot is running",
    webhook_url: WEBHOOK_URL,
  });
});

app.get("/fix-webhook", async (req, res) => {
  try {
    await bot.telegram.deleteWebhook();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await bot.telegram.setWebhook(WEBHOOK_URL);
    const webhookInfo = await bot.telegram.getWebhookInfo();

    res.json({
      success: true,
      webhook_url: WEBHOOK_URL,
      webhook_info: webhookInfo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await bot.telegram.deleteWebhook();
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log("Webhook configured successfully");

    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log("Webhook URL:", webhookInfo.url);
    console.log("Pending Updates:", webhookInfo.pending_update_count);
  } catch (err) {
    console.error("Failed to configure webhook:", err);
  }
});
