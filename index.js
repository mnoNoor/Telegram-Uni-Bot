import { Telegraf } from "telegraf";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const responses = require("./responses.json");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome!"));
bot.hears(/^(ردود|الردود)$/i, (ctx) => {
  ctx.reply(`📋 ردود البوت:
    
  1- مستويات الانجليزي
  2- الارشادات
  3- تحديد المستوى
  4- الشؤون
  5- التخصصات
  6- نسب s25
  7- تسجيل الفصول
  8- مواصفات اللابتوب`);
});

bot.hears(/^(en|مستويات الانجليزي|مستويات الإنجليزي)$/i, (ctx) => {
  ctx.replyWithPhoto(
    { source: "./images/english_levels.png" },
    { caption: "مستويات الإنجليزي" }
  );
});

bot.hears(/^(الارشادات|guide)$/i, (ctx) => {
  ctx.replyWithDocument(responses.guide, {
    caption: "لائحة الهندسة المعلوماتية",
  });
});

bot.hears(/^(تحديد المستوى|PT)$/i, (ctx) => {
  ctx.replyWithDocument(responses.PT, { caption: "اختبار تحديد المستوى" });
});

bot.hears(/^(الشؤون|email)$/i, (ctx) => {
  ctx.reply(`ايميل شؤون المعلوماتية: ${responses.email}`);
});

bot.hears(/^(التخصصات|majors)$/i, (ctx) => {
  ctx.reply(responses.majors);
});

bot.hears(/^(نسب s25|acceptance 2025|acceptance s25)$/i, (ctx) => {
  ctx.reply(responses.acceptance_s25);
});

bot.hears(/^(تسجيل الفصول|تسجيل الشعب)$/i, (ctx) => {
  ctx.reply(responses.course_registration);
});

bot.hears(/^(مواصفات اللابتوب|المواصفات|laptop)$/i, (ctx) => {
  ctx.reply(responses.laptop_specs);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
