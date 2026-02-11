import { opencodeClient } from "./client.js";
import { Event } from "@opencode-ai/sdk/v2";
import { logger } from "../utils/logger.js";

type EventCallback = (event: Event) => void;

let eventStream: AsyncGenerator<Event, unknown, unknown> | null = null;
let eventCallback: EventCallback | null = null;
let isListening = false;
let activeDirectory: string | null = null;
let streamAbortController: AbortController | null = null;

export async function subscribeToEvents(directory: string, callback: EventCallback): Promise<void> {
  if (isListening && activeDirectory === directory) {
    logger.debug(`Event listener already running for ${directory}`);
    return;
  }

  if (isListening && activeDirectory !== directory) {
    logger.info(`Stopping event listener for ${activeDirectory}, starting for ${directory}`);
    streamAbortController?.abort();
    streamAbortController = null;
    isListening = false;
    activeDirectory = null;
  }

  const controller = new AbortController();

  activeDirectory = directory;
  eventCallback = callback;
  isListening = true;
  streamAbortController = controller;

  try {
    const result = await opencodeClient.event.subscribe(
      { directory },
      { signal: controller.signal },
    );

    if (!result.stream) {
      throw new Error("No stream returned from event subscription");
    }

    eventStream = result.stream;

    for await (const event of eventStream) {
      if (!isListening || activeDirectory !== directory) {
        logger.debug(`Event listener stopped or changed directory, breaking loop`);
        break;
      }

      // CRITICAL: Explicitly yield to the event loop BEFORE processing the event
      // This allows grammY to handle getUpdates between SSE events
      await new Promise<void>((resolve) => setImmediate(resolve));

      if (eventCallback) {
        // Use setImmediate to avoid blocking the event loop
        // and let grammY process incoming Telegram updates
        const callback = eventCallback;
        setImmediate(() => callback(event));
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      logger.info("Event listener aborted");
      return;
    }

    logger.error("Event stream error:", error);
    isListening = false;
    activeDirectory = null;
    streamAbortController = null;
    throw error;
  } finally {
    if (streamAbortController === controller) {
      if (isListening && activeDirectory === directory && !controller.signal.aborted) {
        logger.warn(`Event stream ended for ${directory}, listener marked as disconnected`);
      }

      streamAbortController = null;
      eventStream = null;
      eventCallback = null;
      isListening = false;
      activeDirectory = null;
    }
  }
}

export function stopEventListening(): void {
  streamAbortController?.abort();
  streamAbortController = null;
  isListening = false;
  eventCallback = null;
  eventStream = null;
  activeDirectory = null;
  logger.info("Event listener stopped");
}
