import express from "express";
import { createBot } from "./index.js";

// environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("Please set BOT_TOKEN and WEBHOOK_URL in .env");
  process.exit(1);
}

// from index.js
const bot = createBot(BOT_TOKEN);

const app = express();
app.use(express.json());

// Webhook endpoint
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Bot is running via Webhook!");
});

// Start server
app
  .listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await bot.telegram.setWebhook(`${WEBHOOK_URL}/bot${BOT_TOKEN}`);
      console.log(`Webhook set to ${WEBHOOK_URL}/bot${BOT_TOKEN}`);
    } catch (err) {
      console.error("Failed to set webhook:", err);
    }
  })
  .on("error", (err) => {
    console.error("Server error:", err);
  });
