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
          "اكتب: تغير جريدة ثم مسافة ثم نص الجريدة الجديدة.\nولتغيير جريدة بوت واحد فقط: اكتب معرف البوت أولاً ثم الأمر، مثل:\n123456789 تغير جريدة النص الجديد",
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
        "✅ تم حفظ الجريدة الجديدة للكل، وستُستخدم في قصف وماهوراغا فوراً.",
        event.threadID,
      );
    },
  };
}

// matches "<botID> تغير جريدة <text>" when botID is this bot — returns the
// newspaper text (possibly empty) or null when the message is not scoped.
function extractScoped(botID, body) {
  const cleanBody = String(body || "").trim();
  const spaceIdx = cleanBody.search(/\s/u);
  if (spaceIdx === -1) return null;

  const rawID = normalizeBotID(cleanBody.slice(0, spaceIdx));
  if (!rawID || String(rawID) !== String(botID || "").trim()) return null;

  const rest = cleanBody.slice(spaceIdx).replace(/^\s+/u, "");
  const separator = rest[COMMAND_PREFIX.length];
  if (
    !rest.startsWith(COMMAND_PREFIX) ||
    (separator && !/\s/u.test(separator))
  ) {
    return null;
  }
  return rest.slice(COMMAND_PREFIX.length).replace(/^\s+/u, "");
}

// Saves the newspaper for this bot only (keyed by its own Facebook ID).
async function executeScoped(newspaperService, api, event, text) {
  if (!String(text || "").trim()) {
    await api.sendMessage(
      "اكتب: تغير جريدة ثم مسافة ثم نص الجريدة الجديدة، وستُحفظ لهذا البوت فقط.",
      event.threadID,
    );
    return;
  }

  const botID = api.getCurrentUserID ? String(api.getCurrentUserID() || "") : "";
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
}

module.exports = {
  ...createNewspaperCommand(qasf),
  createNewspaperCommand,
  extractScoped,
  executeScoped: (api, event, text) => executeScoped(qasf, api, event, text),
};
