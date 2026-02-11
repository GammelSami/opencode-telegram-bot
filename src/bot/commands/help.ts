import { Context } from "grammy";
import { t } from "../../i18n/index.js";

export async function helpCommand(ctx: Context): Promise<void> {
  await ctx.reply(t("help.text"), { parse_mode: "Markdown" });
}
