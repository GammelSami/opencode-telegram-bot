const TEST_ENV_DEFAULTS: Record<string, string> = {
  TELEGRAM_BOT_TOKEN: "test-telegram-token",
  TELEGRAM_ALLOWED_USER_ID: "123456789",
  OPENCODE_API_URL: "http://localhost:4096",
  OPENCODE_MODEL_PROVIDER: "test-provider",
  OPENCODE_MODEL_ID: "test-model",
  LOG_LEVEL: "error",
};

export function ensureTestEnvironment(): void {
  for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
