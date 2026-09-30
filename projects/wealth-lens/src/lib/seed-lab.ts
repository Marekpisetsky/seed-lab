/**
 * seed-lab, the family Wealth Lens belongs to: the hub's address and the
 * list of its projects (src/data/seed-lab-projects.json). Kept apart so
 * another session can change them without touching components.
 */

import projects from "@/data/seed-lab-projects.json";

/** The seed-lab hub (provisional). */
export const SEED_LAB_HUB_URL = "https://seed-lab-hub.vercel.app";

export interface SeedLabProject {
  id: string;
  name: string;
  /** Where it lives; the current project's own address is "/". */
  url: string;
  /** This app. */
  current?: boolean;
}

function parseProjects(value: unknown): SeedLabProject[] {
  if (!Array.isArray(value)) throw new Error("seed-lab-projects.json must be a list");
  return value.map((entry, index) => {
    const project = entry as Record<string, unknown>;
    if (typeof project.id !== "string" || typeof project.name !== "string" || typeof project.url !== "string") {
      throw new Error(`seed-lab project ${index} needs an id, a name and a url`);
    }
    return { id: project.id, name: project.name, url: project.url, ...(project.current === true ? { current: true } : {}) };
  });
}

export const SEED_LAB_PROJECTS: readonly SeedLabProject[] = parseProjects(projects);
