import { Telegraf, Markup } from "telegraf";

export function createBot(token) {
  const bot = new Telegraf(token);

  const startMessage = (ctx) => {
    ctx.reply(
      "أهلاً بك في البوت 🤖\nاختر أحد الخيارات:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("📘 معلومات", "INFO"),
          Markup.button.callback("📞 تواصل", "CONTACT"),
        ],
      ])
    );
  };

  bot.start((ctx) => {
    startMessage(ctx);
  });

  bot.action("INFO", (ctx) => {
    ctx.editMessageText(
      "📘 هذا نص تجريبي للمعلومات.\nيمكنك وضع أي محتوى هنا.",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔙 الرجوع للبداية", "BACK_TO_START")],
      ])
    );
  });

  bot.action("CONTACT", (ctx) => {
    ctx.editMessageText(
      "📞 للتواصل:\nexample@email.com\n+963xxxxxxxx",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔙 الرجوع للبداية", "BACK_TO_START")],
      ])
    );
  });

  bot.action("BACK_TO_START", (ctx) => {
    startMessage(ctx);
  });

  return bot;
}
  
