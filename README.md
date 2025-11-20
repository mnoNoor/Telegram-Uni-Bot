# 🧠 SVU Information Bot

A Telegram bot built using **Telegraf** to provide essential information for students such as:

- English level chart
- Guidance and regulations
- Placement test details
- IT Affairs contact
- Academic majors
- Laptop specifications
- Course registration steps
- Acceptance rates

---

## 🚀 Features

- Responds to user messages using keyword-based triggers.
- Sends text, photos, files, and predefined responses.
- Uses external configuration from `responses.json`.
- Supports both Arabic and English keywords.
- Runs via **Webhook** using Express for fast and efficient message handling.

---

## 📦 Requirements

- Node.js 20+
- A Telegram bot token from **BotFather**
- `.env` file containing your BOT_TOKEN and WEBHOOK_URL (for local development)
- HTTPS URL for the webhook (required by Telegram)

---

## ⚙️ Installation

```bash
git clone <repository-url>
cd bot
npm install
```

---

## 🔧 Configuration

Create a `.env` file for local development:

```
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
WEBHOOK_URL=https://your-local-or-public-url.com
PORT=3000  # optional, default is 3000 for local testing
```

> On **Render**, set `BOT_TOKEN` and `WEBHOOK_URL` in **Environment → Environment Variables**.
> Render provides the PORT automatically, no need for `.env`.

---

## ▶️ Run the Bot

### Locally:

```bash
node --env-file=.env server.js
```

or

```bash
npm start
```

### On Render or any cloud platform:

```bash
node server.js
```

> The bot uses Webhook, so it will automatically respond to messages via the configured URL.

---

## 📁 Project Structure

```
📂 project/
 ├─ index.js         # Bot logic
 ├─ server.js        # Express server + Webhook
 ├─ package.json
 ├─ package-lock.json
 ├─ responses.json
 ├─ .env             # local environment variables (ignored in GitHub)
 └─ README.md
```

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🤝 Contributing

Issues and pull requests are welcome!
