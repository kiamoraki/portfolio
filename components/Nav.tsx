import { getAllProjects } from "@/lib/projects";
import { NavClient } from "./NavClient";

type Props = { theme?: "dark" | "light" };

export function Nav({ theme = "light" }: Props) {
  const projects = getAllProjects()
    .filter((p) => !p.hidden)
    .map((p) => ({ slug: p.slug, title: p.title }));
  return <NavClient theme={theme} projects={projects} />;
}
