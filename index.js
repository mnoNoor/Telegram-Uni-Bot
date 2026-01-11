import { Telegraf, Markup } from "telegraf";

const residential_units = [
  { id: 1, name: "شقة", rooms: 2, neighborhood: "حي النظيم", price: 300, reserved: false },
  { id: 2, name: "شقة", rooms: 3, neighborhood: "حي النسيم الشرقي", price: 450, reserved: false },
  { id: 3, name: "استوديو", rooms: 1, neighborhood: "حي الملز", price: 200, reserved: false },
  { id: 4, name: "شقة", rooms: 2, neighborhood: "الحي المركزي", price: 320, reserved: false },
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
    await ctx.answerCbQuery().catch(() => {});
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
    await ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(
      "📞 للتواصل:\nexample@email.com\n+963xxxxxxxx",
      backKeyboard()
    );
  });

  const UNITS_PER_PAGE = 5;

  async function clearPreviousRentMessages(ctx, userId) {
    const session = userSessions[userId];
    if (!session) return;
    if (!session.rentMessageIds) return;
    for (const msgId of session.rentMessageIds) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, msgId);
      } catch (e) {}
    }
    session.rentMessageIds = [];
  }

  async function renderRent(ctx) {
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    if (!userSessions[userId].rentPage) userSessions[userId].rentPage = 1;
    if (!userSessions[userId].rentMessageIds) userSessions[userId].rentMessageIds = [];

    const page = userSessions[userId].rentPage;
    const availableUnits = residential_units.filter((u) => !u.reserved);

    if (availableUnits.length === 0) {
      try {
        return await ctx.editMessageText("❌ لا توجد وحدات متاحة حاليًا.", backKeyboard());
      } catch (e) {
        return ctx.reply("❌ لا توجد وحدات متاحة حاليًا.", backKeyboard());
      }
    }

    const start = (page - 1) * UNITS_PER_PAGE;
    const end = start + UNITS_PER_PAGE;
    const pageUnits = availableUnits.slice(start, end);

    await clearPreviousRentMessages(ctx, userId);

    const navRow = [];
    if (page > 1) navRow.push(Markup.button.callback("⬅️ السابق", "RENT_PREV"));
    if (end < availableUnits.length) navRow.push(Markup.button.callback("التالي ➡️", "RENT_NEXT"));
    navRow.push(Markup.button.callback("الرجوع للبداية 🏠", "BACK_TO_START"));

    for (let i = 0; i < pageUnits.length; i++) {
      const unit = pageUnits[i];
      const text = `🏠 *${unit.name}* (الرقم: ${unit.id})
🛏️ عدد الغرف: *${unit.rooms}*
📍 الحي: *${unit.neighborhood}*
💰 السعر: *${unit.price}$*`;

      const keyboardRows = [
        [Markup.button.callback("حجز هذه الوحدة ✅", `UNIT_${unit.id}`)],
      ];
      if (i === pageUnits.length - 1) {
        keyboardRows.push(navRow);
      }

      const sent = await ctx.telegram.sendMessage(ctx.chat.id, text, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(keyboardRows).reply_markup,
      }).catch(() => null);

      if (sent && sent.message_id) {
        userSessions[userId].rentMessageIds.push(sent.message_id);
      }
    }
  }

  bot.action("RENT", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = 1;
    await renderRent(ctx);
  });

  bot.action("RENT_NEXT", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = (userSessions[userId].rentPage || 1) + 1;
    await renderRent(ctx);
  });

  bot.action("RENT_PREV", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const userId = ctx.from.id;
    if (!userSessions[userId]) userSessions[userId] = {};
    userSessions[userId].rentPage = Math.max(1, (userSessions[userId].rentPage || 1) - 1);
    await renderRent(ctx);
  });

  bot.action(/UNIT_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const unitId = Number(ctx.match[1]);
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].selectedUnit = unitId;

    const unit = residential_units.find((u) => u.id === unitId);
    if (!unit) return ctx.reply("❌ لم أجد هذه الوحدة.");

    try {
      await ctx.editMessageText(
        `🏠 ${unit.name}\n🛏️ عدد الغرف: ${unit.rooms}\n📍 الحي: ${unit.neighborhood}\n💰 ${unit.price}$\n\nاختر يوم بداية الحجز:`,
        Markup.inlineKeyboard([
          [Markup.button.callback("اليوم", "START_TODAY"), Markup.button.callback("غدًا", "START_TOMORROW")],
          [Markup.button.callback("الرجوع ⏪", "RENT")],
        ])
      );
    } catch (e) {
      await ctx.reply(
        `🏠 ${unit.name}\n🛏️ عدد الغرف: ${unit.rooms}\n📍 الحي: ${unit.neighborhood}\n💰 ${unit.price}$\n\nاختر يوم بداية الحجز:`,
        Markup.inlineKeyboard([
          [Markup.button.callback("اليوم", "START_TODAY"), Markup.button.callback("غدًا", "START_TOMORROW")],
          [Markup.button.callback("الرجوع ⏪", "RENT")],
        ])
      );
    }
  });

  bot.action("START_TODAY", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].startDate = new Date();
    askForId(ctx);
  });

  bot.action("START_TOMORROW", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
    userSessions[ctx.from.id].startDate = addDays(new Date(), 1);
    askForId(ctx);
  });

  function askForId(ctx) {
    userSessions[ctx.from.id].waitingForId = true;
    ctx.editMessageText(
      "🪪 من فضلك اكتب رقم الهوية الخاص بك:",
      Markup.inlineKeyboard([[Markup.button.callback("إلغاء ❌", "BACK_TO_START")]])
    );
  }

  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    const session = userSessions[ctx.from.id];
    if (session?.waitingForId) {
      const idNumber = text;
      if (!/^\d{10}$/.test(idNumber)) {
        return ctx.reply("❌ رقم الهوية غير صالح، يجب أن يكون 10 أرقام. حاول مرة أخرى:");
      }
      session.idNumber = idNumber;
      session.waitingForId = false;
      return askDuration(ctx);
    }

    const bookMatch = text.match(/^(?:حجز\s*)?(\d{1,5})$/i);
    if (bookMatch) {
      const unitId = Number(bookMatch[1]);
      const unit = residential_units.find((u) => u.id === unitId && !u.reserved);
      if (!unit) {
        return ctx.reply("❌ لم أجد هذه الوحدة أو أنها محجوزة. تأكد من الرقم وحاول مجددًا.");
      }
      if (!userSessions[ctx.from.id]) userSessions[ctx.from.id] = {};
      userSessions[ctx.from.id].selectedUnit = unitId;
      return ctx.reply(
        `🏠 ${unit.name}\n🛏️ عدد الغرف: ${unit.rooms}\n📍 الحي: ${unit.neighborhood}\n💰 ${unit.price}$\n\nاختر يوم بداية الحجز بواسطة الأزرار:`,
        Markup.inlineKeyboard([
          [Markup.button.callback("اليوم", "START_TODAY"), Markup.button.callback("غدًا", "START_TOMORROW")],
          [Markup.button.callback("الرجوع ⏪", "RENT")],
        ])
      );
    }
  });

  function askDuration(ctx) {
    ctx.reply(
      "⏳ اختر مدة الحجز:",
      Markup.inlineKeyboard([
        [Markup.button.callback("يوم واحد", "DURATION_1"), Markup.button.callback("أسبوع", "DURATION_7")],
        [Markup.button.callback("شهر", "DURATION_30"), Markup.button.callback("سنة", "DURATION_365")],
      ])
    );
  }

  bot.action(/DURATION_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const days = Number(ctx.match[1]);
    const session = userSessions[ctx.from.id];
    if (!session || !session.startDate || !session.selectedUnit || !session.idNumber) {
      return ctx.reply("❌ جلسة الحجز غير مكتملة. ابدأ من جديد بالضغط على 'حجز وحدة 🏠'.");
    }
    const endDate = addDays(session.startDate, days);
    session.durationDays = days;
    session.endDate = endDate;
    const unit = residential_units.find((u) => u.id === session.selectedUnit);
    if (!unit) return ctx.reply("❌ الوحدة غير موجودة.");
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
        [Markup.button.callback("تأكيد ✅", "CONFIRM_RENT"), Markup.button.callback("إلغاء ❌", "BACK_TO_START")],
      ])
    );
  });

  bot.action("CONFIRM_RENT", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const session = userSessions[ctx.from.id];
    if (!session || !session.selectedUnit) return ctx.reply("❌ لا يوجد حجز ليتم تأكيده.");
    const unit = residential_units.find((u) => u.id === session.selectedUnit);
    if (!unit) return ctx.reply("❌ الوحدة غير موجودة.");
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
    ctx.editMessageText("✅ تم تأكيد الحجز بنجاح!", backKeyboard());
  });

  bot.action("STATUS", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const reservation = userSessions[ctx.from.id]?.reservation;
    if (!reservation) {
      return ctx.editMessageText("📋 لا يوجد لديك أي حجز.", backKeyboard());
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
        [Markup.button.callback("إلغاء الحجز ❌", "CANCEL_RENT"), Markup.button.callback("الرجوع 🏠", "BACK_TO_START")],
      ])
    );
  });

  bot.action("CANCEL_RENT", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const session = userSessions[ctx.from.id];
    if (!session?.reservation) return ctx.reply("❌ لا يوجد حجز لإلغائه.");
    session.reservation.unit.reserved = false;
    session.reservation = null;
    ctx.editMessageText("❌ تم إلغاء الحجز بنجاح.", backKeyboard());
  });

  bot.action("BACK_TO_START", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    startMessage(ctx);
  });

  return bot;
}
