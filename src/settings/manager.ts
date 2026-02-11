import type { ModelInfo } from "../model/types.js";
import path from "node:path";
import { getRuntimePaths } from "../runtime/paths.js";
import { logger } from "../utils/logger.js";

export interface ProjectInfo {
  id: string;
  worktree: string;
  name?: string;
}

export interface SessionInfo {
  id: string;
  title: string;
  directory: string;
}

export interface ServerProcessInfo {
  pid: number;
  startTime: string; // ISO string
}

export interface Settings {
  currentProject?: ProjectInfo;
  currentSession?: SessionInfo;
  currentAgent?: string;
  currentModel?: ModelInfo;
  pinnedMessageId?: number;
  serverProcess?: ServerProcessInfo;
}

function getSettingsFilePath(): string {
  return getRuntimePaths().settingsFilePath;
}

async function readSettingsFile(): Promise<Settings> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(getSettingsFilePath(), "utf-8");
    return JSON.parse(content) as Settings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error("[SettingsManager] Error reading settings file:", error);
    }
    return {};
  }
}

function writeSettingsFile(settings: Settings): void {
  import("fs/promises").then((fs) => {
    const settingsFilePath = getSettingsFilePath();
    fs.mkdir(path.dirname(settingsFilePath), { recursive: true })
      .then(() => fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2)))
      .catch((err: Error) => {
        logger.error("[SettingsManager] Error writing settings file:", err);
      });
  });
}

let currentSettings: Settings = {};

export function getCurrentProject(): ProjectInfo | undefined {
  return currentSettings.currentProject;
}

export function setCurrentProject(projectInfo: ProjectInfo): void {
  currentSettings.currentProject = projectInfo;
  writeSettingsFile(currentSettings);
}

export function clearProject(): void {
  currentSettings.currentProject = undefined;
  writeSettingsFile(currentSettings);
}

export function getCurrentSession(): SessionInfo | undefined {
  return currentSettings.currentSession;
}

export function setCurrentSession(sessionInfo: SessionInfo): void {
  currentSettings.currentSession = sessionInfo;
  writeSettingsFile(currentSettings);
}

export function clearSession(): void {
  currentSettings.currentSession = undefined;
  writeSettingsFile(currentSettings);
}

export function getCurrentAgent(): string | undefined {
  return currentSettings.currentAgent;
}

export function setCurrentAgent(agentName: string): void {
  currentSettings.currentAgent = agentName;
  writeSettingsFile(currentSettings);
}

export function clearCurrentAgent(): void {
  currentSettings.currentAgent = undefined;
  writeSettingsFile(currentSettings);
}

export function getCurrentModel(): ModelInfo | undefined {
  return currentSettings.currentModel;
}

export function setCurrentModel(modelInfo: ModelInfo): void {
  currentSettings.currentModel = modelInfo;
  writeSettingsFile(currentSettings);
}

export function clearCurrentModel(): void {
  currentSettings.currentModel = undefined;
  writeSettingsFile(currentSettings);
}

export function getPinnedMessageId(): number | undefined {
  return currentSettings.pinnedMessageId;
}

export function setPinnedMessageId(messageId: number): void {
  currentSettings.pinnedMessageId = messageId;
  writeSettingsFile(currentSettings);
}

export function clearPinnedMessageId(): void {
  currentSettings.pinnedMessageId = undefined;
  writeSettingsFile(currentSettings);
}

export function getServerProcess(): ServerProcessInfo | undefined {
  return currentSettings.serverProcess;
}

export function setServerProcess(processInfo: ServerProcessInfo): void {
  currentSettings.serverProcess = processInfo;
  writeSettingsFile(currentSettings);
}

export function clearServerProcess(): void {
  currentSettings.serverProcess = undefined;
  writeSettingsFile(currentSettings);
}

export async function loadSettings(): Promise<void> {
  currentSettings = await readSettingsFile();
}
