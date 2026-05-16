import { Nav } from "@/components/Nav";
import { ProjectGrid } from "@/components/ProjectGrid";
import { getAllProjects } from "@/lib/projects";

export default function Home() {
  const projects = getAllProjects().filter((p) => !p.hidden);

  return (
    <>
      <Nav />
      <main className="index">
        <ProjectGrid projects={projects} />
      </main>
    </>
  );
}
