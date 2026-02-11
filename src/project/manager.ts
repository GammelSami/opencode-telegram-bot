import { opencodeClient } from "../opencode/client.js";
import { ProjectInfo } from "../settings/manager.js";

export async function getProjects(): Promise<ProjectInfo[]> {
  const { data: projects, error } = await opencodeClient.project.list();

  if (error || !projects) {
    throw error || new Error("No data received from server");
  }

  return projects.map((project) => ({
    id: project.id,
    worktree: project.worktree,
    name: project.name || project.worktree,
  }));
}

export async function getProjectById(id: string): Promise<ProjectInfo> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    throw new Error(`Project with id ${id} not found`);
  }
  return project;
}

export async function getProjectByWorktree(worktree: string): Promise<ProjectInfo> {
  const projects = await getProjects();
  const project = projects.find((p) => p.worktree === worktree);
  if (!project) {
    throw new Error(`Project with worktree ${worktree} not found`);
  }
  return project;
}
