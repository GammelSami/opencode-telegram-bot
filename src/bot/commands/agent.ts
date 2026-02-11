import { CommandContext, Context } from "grammy";
import { showAgentSelectionMenu } from "../handlers/agent.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";

/**
 * Handler for /agent command
 * Shows inline menu to select agent mode
 */
export async function handleAgentCommand(ctx: CommandContext<Context>) {
  logger.debug("[AgentCommand] /agent command received");

  try {
    await showAgentSelectionMenu(ctx);
  } catch (err) {
    logger.error("[AgentCommand] Error showing agent menu:", err);
    await ctx.reply(t("error.load_agents"));
  }
}
