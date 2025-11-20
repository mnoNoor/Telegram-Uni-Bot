import express from "express";
import { createBot } from "./index.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !WEBHOOK_URL)
  throw new Error("Set BOT_TOKEN and WEBHOOK_URL");
const bot = createBot(BOT_TOKEN);
const app = express();
app.use(express.json());

// Webhook endpoint
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling update:", err);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => res.send("Bot is running via Webhook!"));

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await bot.telegram.setWebhook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
    console.log("Webhook set successfully!");
  } catch (err) {
    console.error("Failed to set webhook:", err.response?.data || err.message);
  }
});
