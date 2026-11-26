const qasf = require("./قصف");

const COMMAND_PREFIX = "تغير جريدة";

function normalizeBotID(text) {
  return String(text || "")
    .replace(/(?:fb)?id[:.]/iu, "")
    .replace(/\D/g, "")
    .trim();
}

function createNewspaperCommand(newspaperService) {
  return {
    name: COMMAND_PREFIX,

    async execute(api, event) {
      const body = String(event.body || "").trimStart();
      const separator = body[COMMAND_PREFIX.length];
      if (
        !body.startsWith(COMMAND_PREFIX) ||
        (separator && !/\s/u.test(separator))
      ) {
        return;
      }

      const text = body.slice(COMMAND_PREFIX.length).replace(/^\s+/u, "");
      if (!text.trim()) {
        await api.sendMessage(
          "اكتب: تغير جريدة ثم مسافة ثم نص الجريدة الجديدة.\nولتغيير جريدة بوت واحد فقط: ضع معرف البوت أولاً ثم الأمر، مثل:\n123456789 تغير جريدة النص الجديد",
          event.threadID,
        );
        return;
      }

      try {
        newspaperService.setNewspaperText(text);
      } catch (error) {
        console.error(
          "[تغير جريدة] تعذّر حفظ الجريدة:",
          error.message || error,
        );
        await api.sendMessage(
          "❌ تعذّر حفظ الجريدة الجديدة. لم يتغير النص الحالي.",
          event.threadID,
        );
        return;
      }

      await api.sendMessage(
        "✅ تم حفظ الجريدة الجديدة، وستُستخدم في قصف وماهوراغا فوراً.",
        event.threadID,
      );
    },
  };
}

// Handles the form "<botID> تغير جريدة <text>" — only the bot whose ID leads
// the message executes, and only its own newspaper changes. Other bots keep
// the shared newspaper. Exposed as a route checked before the normal command.
function createBotScopedNewspaperCommand(newspaperService) {
  return {
    name: `${COMMAND_PREFIX}#scoped`,

    matches(botID, body) {
      const cleanBody = String(body || "").trim();
      const spaceIdx = cleanBody.search(/\s/u);
      if (spaceIdx === -1) return false;
      const rawID = normalizeBotID(cleanBody.slice(0, spaceIdx));
      if (!rawID || String(rawID) !== String(botID || "").trim()) return false;
      const rest = cleanBody.slice(spaceIdx).replace(/^\s+/u, "");
      if (!rest.startsWith(COMMAND_PREFIX)) return false;
      const after = rest.slice(COMMAND_PREFIX.length);
      return !after || /^\s/u.test(after);
    },

    async execute(api, event) {
      const cleanBody = String(event.body || "").trim();
      const spaceIdx = cleanBody.search(/\s/u);
      const rest = cleanBody.slice(spaceIdx).replace(/^\s+/u, "");
      const text = rest.slice(COMMAND_PREFIX.length).replace(/^\s+/u, "");

      if (!text.trim()) {
        await api.sendMessage(
          "اكتب: تغير جريدة ثم مسافة ثم نص الجريدة الجديدة، وستُحفظ لهذا البوت فقط.",
          event.threadID,
        );
        return;
      }

      const botID = api.getCurrentUserID ? String(api.getCurrentUserID()) : "";
      try {
        newspaperService.setNewspaperTextForBot(botID, text);
      } catch (error) {
        console.error(
          "[تغير جريدة] تعذّر حفظ جريدة البوت:",
          error.message || error,
        );
        await api.sendMessage(
          "❌ تعذّر حفظ الجريدة الجديدة لهذا البوت. لم يتغير النص الحالي.",
          event.threadID,
        );
        return;
      }

      await api.sendMessage(
        "✅ تم حفظ الجريدة الجديدة لهذا البوت فقط، وستُستخدم في قصف وماهوراغا فوراً.",
        event.threadID,
      );
    },
  };
}

const scopedCommand = createBotScopedNewspaperCommand(qasf);

module.exports = {
  ...createNewspaperCommand(qasf),
  createNewspaperCommand,
  createBotScopedNewspaperCommand,
  scopedCommand,
};
