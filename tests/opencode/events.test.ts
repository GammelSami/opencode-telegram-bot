import { describe, expect, it, vi } from "vitest";
import type { Event } from "@opencode-ai/sdk/v2";

const { subscribeMock } = vi.hoisted(() => {
  return {
    subscribeMock: vi.fn(),
  };
});

vi.mock("../../src/opencode/client.js", () => ({
  opencodeClient: {
    event: {
      subscribe: subscribeMock,
    },
  },
}));

import { stopEventListening, subscribeToEvents } from "../../src/opencode/events.js";

function createStream(events: Event[]): AsyncGenerator<Event, void, unknown> {
  return (async function* () {
    for (const event of events) {
      yield event;
    }
  })();
}

function createAbortableStream(signal: AbortSignal): AsyncGenerator<Event, void, unknown> {
  return (async function* () {
    while (!signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  })();
}

function flushImmediate(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("opencode/events", () => {
  it("subscribes to stream and forwards events to callback", async () => {
    const eventA = { type: "session.status", properties: { sessionID: "s1" } } as Event;
    const eventB = { type: "session.idle", properties: { sessionID: "s1" } } as Event;
    subscribeMock.mockResolvedValueOnce({ stream: createStream([eventA, eventB]) });

    const callback = vi.fn();
    await subscribeToEvents("D:/repo", callback);
    await flushImmediate();
    await flushImmediate();

    expect(subscribeMock).toHaveBeenCalledWith(
      { directory: "D:/repo" },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[0][0]).toEqual(eventA);
    expect(callback.mock.calls[1][0]).toEqual(eventB);
  });

  it("does not create duplicate subscription for same directory while active", async () => {
    subscribeMock.mockImplementation(async (_params, options: { signal: AbortSignal }) => {
      return { stream: createAbortableStream(options.signal) };
    });

    const firstCallback = vi.fn();
    const firstSubscription = subscribeToEvents("D:/repo", firstCallback);

    await vi.waitFor(() => {
      expect(subscribeMock).toHaveBeenCalledTimes(1);
    });

    await subscribeToEvents("D:/repo", vi.fn());
    expect(subscribeMock).toHaveBeenCalledTimes(1);

    stopEventListening();
    await firstSubscription;
  });

  it("aborts previous stream when directory changes", async () => {
    let firstSignal: { aborted: boolean } | null = null;

    subscribeMock
      .mockImplementationOnce(async (_params, options: { signal: AbortSignal }) => {
        firstSignal = options.signal;
        return { stream: createAbortableStream(options.signal) };
      })
      .mockResolvedValueOnce({ stream: createStream([]) });

    const firstSubscription = subscribeToEvents("D:/repo-a", vi.fn());

    await vi.waitFor(() => {
      expect(subscribeMock).toHaveBeenCalledTimes(1);
    });

    await subscribeToEvents("D:/repo-b", vi.fn());

    expect(subscribeMock).toHaveBeenCalledTimes(2);
    expect(firstSignal).toEqual(expect.objectContaining({ aborted: true }));

    await firstSubscription;
  });

  it("throws when subscribe result has no stream", async () => {
    subscribeMock.mockResolvedValueOnce({ stream: null });

    await expect(subscribeToEvents("D:/repo", vi.fn())).rejects.toThrow(
      "No stream returned from event subscription",
    );
  });
});
