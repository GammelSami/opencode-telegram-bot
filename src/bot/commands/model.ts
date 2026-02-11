import { CommandContext, Context } from "grammy";
import { showModelSelectionMenu } from "../handlers/model.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";

/**
 * Handler for /model command
 * Shows inline menu to select model from favorites
 */
export async function handleModelCommand(ctx: CommandContext<Context>) {
  logger.debug("[ModelCommand] /model command received");

  try {
    await showModelSelectionMenu(ctx);
  } catch (err) {
    logger.error("[ModelCommand] Error showing model menu:", err);
    await ctx.reply(t("error.load_models"));
  }
}
