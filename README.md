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

---

## 📦 Requirements

- Node.js 20+
- A Telegram bot token from **BotFather**
- `.env` file containing your BOT_TOKEN

---

## ⚙️ Installation

```bash
git clone <repository-url>
cd bot
npm install
```

---

## 🔧 Configuration

Create a `.env` file:

```
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

---

## ▶️ Run the Bot

```bash
npm start
```

Or:

```bash
node --env-file=.env index.js
```

---

## 📁 Project Structure

```
📂 project/
 ├─ index.js
 ├─ package.json
 ├─ responses.json
 ├─ images/
 │   └─ english_levels.png
 ├─ .env
 └─ README.md
```

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🤝 Contributing

Issues and pull requests are welcome!
