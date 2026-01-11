import { Telegraf, Markup } from "telegraf";

const residential_units = [
  { id: 1, name: "شقة", rooms: 2, neighborhood: "حي النظيم", price: 300, reserved: false },
  { id: 2, name: "شقة", rooms: 3, neighborhood: "حي النسيم الشرقي", price: 450, reserved: false },
  { id: 3, name: "استوديو", rooms: 1, neighborhood: "حي النسيم الغربي", price: 200, reserved: false },
  { id: 4, name: "شقة", rooms: 2, neighborhood: "حي الملز", price: 320, reserved: false },
  { id: 5, name: "شقة", rooms: 4, neighborhood: "حي النرجس", price: 600, reserved: false },
  { id: 6, name: "شقة", rooms: 1, neighborhood: "الحي القديم", price: 220, reserved: false },
  { id: 7, name: "شقة", rooms: 3, neighborhood: "الحي الشمالي", price: 480, reserved: false },
  { id: 8, name: "استوديو", rooms: 1, neighborhood: "الحي الجنوبي", price: 190, reserved: false },
];

const userSessions = {};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function backKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("الرجوع للبداية 🏠", "BACK_TO_START")],
  ]);
}

export function createBot(token) {
  const bot = new Telegraf(token);

  const startMessage = (ctx) => {
    ctx.reply(
      "مرحباً بك في بوت حجز سكني!\nأنا هنا لمساعدتك في حجز الوحدات السكنية بشكل تلقائي.\n\nاستخدم الأزرار بالأسفل للبدء:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("طريقة الاستخدام 📘", "INFO"),
          Markup.button.callback("حجز وحدة 🏠", "RENT"),
        ],
        [
          Markup.button.callback("حالة الحجز 📋", "STATUS"),
          Markup.button.callback("تواصل 📞", "CONTACT"),
        ],
      ])
    );
  };

  bot.start((ctx) => {
    userSessions[ctx.from.id] = {};
    startMessage(ctx);
  });

  bot.action("INFO", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    ctx.editMessageText(
      `📘 هذا البوت مخصص لحجز وحدات سكنية بطريقة سهلة وآمنة.
هذا البوت يساعدك في:

- حجز الوحدات السكنية تلقائياً
- البحث عن زر الحجز في الوقت المحدد
- متابعة حالة الحجز`,
      backKeyboard()
    );
  });

  bot.action("CONTACT", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    ctx.editMessageText(
      "📞 للتواصل:\nexample@email.com\n+963xxxxxxxx",
      backKeyboard()
    );
  });

  const UNITS_PER_PAGE = 5;

  async function renderRent(ctx) {
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    if (!userSessions[userId].rentPage) userSessions[userId].rentPage = 1;

    const page = userSessions[userId].rentPage;
    const availableUnits = residential_units.filter(u => !u.reserved);

    if (availableUnits.length === 0) {
      try {
        return await ctx.editMessageText(
          "❌ لا توجد وحدات متاحة حاليًا.",
          backKeyboard()
        );
      } catch (e) {
        return ctx.reply("❌ لا توجد وحدات متاحة حاليًا.", backKeyboard());
      }
    }

    const start = (page - 1) * UNITS_PER_PAGE;
    const end = start + UNITS_PER_PAGE;
    const pageUnits = availableUnits.slice(start, end);

    if (ctx.callbackQuery) {
      await ctx.deleteMessage().catch(() => {});
    }

    for (const unit of pageUnits) {
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `🏠 *${unit.name}* (الرقم: ${unit.id})
🛏️ عدد الغرف: *${unit.rooms}*
📍 الحي: *${unit.neighborhood}*
💰 السعر: *${unit.price}$*`,
        {
          parse_mode: "Markdown",
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("حجز هذه الوحدة ✅", `UNIT_${unit.id}`)]
          ])
        }
      );
    }

    const navButtons = [];
    if (page > 1) {
      navButtons.push(Markup.button.callback("⬅️ السابق", "RENT_PREV"));
    }
    if (end < availableUnits.length) {
      navButtons.push(Markup.button.callback("التالي ➡️", "RENT_NEXT"));
    }
    navButtons.push(Markup.button.callback("الرجوع للبداية 🏠", "BACK_TO_START"));

    await ctx.telegram.sendMessage(
      ctx.chat.id,
      `📄 الصفحة ${page} — عرض الوحدات ${start + 1}-${Math.min(end, availableUnits.length)} من ${availableUnits.length}`,
      Markup.inlineKeyboard([navButtons])
    );
  }

  bot.action("RENT", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = 1;
    await renderRent(ctx);
  });

  bot.action("RENT_NEXT", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = (userSessions[userId].rentPage || 1) + 1;
    await renderRent(ctx);
  });

  bot.action("RENT_PREV", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = Math.max(1, (userSessions[userId].rentPage || 1) - 1);
    await renderRent(ctx);
  });

  bot.action(/UNIT_(\d+)/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const unitId = Number(ctx.match[1]);
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].selectedUnit = unitId;

    const unit = residential_units.find((u) => u.id === unitId);

    if (!unit) {
      return ctx.reply("❌ لم أجد هذه الوحدة.");
    }

    ctx.editMessageText(
      `🏠 ${unit.name}\n🛏️ عدد الغرف: ${unit.rooms}\n📍 الحي: ${unit.neighborhood}\n💰 ${unit.price}$\n\nاختر يوم بداية الحجز:`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("اليوم", "START_TODAY"),
          Markup.button.callback("غدًا", "START_TOMORROW"),
        ],
        [Markup.button.callback("الرجوع ⏪", "RENT")],
      ])
    );
  });

  bot.action("START_TODAY", (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].startDate = new Date();
    askForId(ctx);
  });

  bot.action("START_TOMORROW", (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].startDate = addDays(new Date(), 1);
    askForId(ctx);
  });

  function askForId(ctx) {
    userSessions[ctx.from.id].waitingForId = true;

    ctx.editMessageText(
      "🪪 من فضلك اكتب رقم الهوية الخاص بك:",
      Markup.inlineKeyboard([
        [Markup.button.callback("إلغاء ❌", "BACK_TO_START")],
      ])
    );
  }

  bot.on("text", (ctx) => {
    const session = userSessions[ctx.from.id];

    if (!session?.waitingForId) return;

    const idNumber = ctx.message.text.trim();

    if (!/^\d{10}$/.test(idNumber)) {
      return ctx.reply("❌ رقم الهوية غير صالح، حاول مرة أخرى:");
    }

    session.idNumber = idNumber;
    session.waitingForId = false;

    askDuration(ctx);
  });

  function askDuration(ctx) {
    ctx.reply(
      "⏳ اختر مدة الحجز:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("يوم واحد", "DURATION_1"),
          Markup.button.callback("أسبوع", "DURATION_7"),
        ],
        [
          Markup.button.callback("شهر", "DURATION_30"),
          Markup.button.callback("سنة", "DURATION_365"),
        ],
      ])
    );
  }

  bot.action(/DURATION_(\d+)/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const days = Number(ctx.match[1]);
    const session = userSessions[ctx.from.id];

    const endDate = addDays(session.startDate, days);
    session.durationDays = days;
    session.endDate = endDate;

    const unit = residential_units.find(
      (u) => u.id === session.selectedUnit
    );

    ctx.editMessageText(
      `📋 مراجعة الحجز:

🏠 الوحدة: ${unit.name}
🛏️ عدد الغرف: ${unit.rooms}
📍 الحي: ${unit.neighborhood}
🪪 رقم الهوية: ${session.idNumber}
📅 البداية: ${formatDate(session.startDate)}
📅 النهاية: ${formatDate(endDate)}
⏳ المدة: ${days} يوم
💰 السعر: ${unit.price}$

هل تريد تأكيد الحجز؟`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("تأكيد ✅", "CONFIRM_RENT"),
          Markup.button.callback("إلغاء ❌", "BACK_TO_START"),
        ],
      ])
    );
  });

  bot.action("CONFIRM_RENT", (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const session = userSessions[ctx.from.id];
    const unit = residential_units.find(
      (u) => u.id === session.selectedUnit
    );

    if (!unit) return ctx.reply("❌ خطأ: الوحدة غير موجودة.");

    if (unit.reserved) {
      return ctx.editMessageText("❌ هذه الوحدة محجوزة مسبقًا.");
    }

    unit.reserved = true;
    session.reservation = {
      unit,
      startDate: session.startDate,
      endDate: session.endDate,
      idNumber: session.idNumber,
    };

    ctx.editMessageText(
      "✅ تم تأكيد الحجز بنجاح!",
      backKeyboard()
    );
  });

  bot.action("STATUS", async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const reservation = userSessions[ctx.from.id]?.reservation;

    if (!reservation) {
      return ctx.editMessageText(
        "📋 لا يوجد لديك أي حجز.",
        backKeyboard()
      );
    }

    ctx.editMessageText(
      `📋 حالة الحجز:
🏠 ${reservation.unit.name}
🛏️ عدد الغرف: ${reservation.unit.rooms}
📍 الحي: ${reservation.unit.neighborhood}
🪪 الهوية: ${reservation.idNumber}
📅 من: ${formatDate(reservation.startDate)}
📅 إلى: ${formatDate(reservation.endDate)}
✅ نشط`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("إلغاء الحجز ❌", "CANCEL_RENT"),
          Markup.button.callback("الرجوع 🏠", "BACK_TO_START"),
        ],
      ])
    );
  });

  bot.action("CANCEL_RENT", (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const session = userSessions[ctx.from.id];
    if (!session?.reservation) return;

    session.reservation.unit.reserved = false;
    session.reservation = null;

    ctx.editMessageText(
      "❌ تم إلغاء الحجز بنجاح.",
      backKeyboard()
    );
  });

  bot.action("BACK_TO_START", (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    startMessage(ctx);
  });

  return bot;
}
