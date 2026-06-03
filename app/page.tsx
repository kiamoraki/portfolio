import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ProjectGrid } from "@/components/ProjectGrid";
import { getAllProjects } from "@/lib/projects";

export default function Home() {
  const projects = getAllProjects().filter((p) => !p.hidden && !p.meta);

  return (
    <>
      <Nav />
      <main className="index">
        <section className="index-intro">
          <p>
            Hi<br />I&rsquo;m Kirby, an interdisciplinary artist and visual systems thinker. <br />
            I render the invisible, visible through{" "}
            <Link href="/projects/animations/">moving meditations</Link>,{" "}
            <Link href="/projects/paintings/">paintings</Link>,{" "}
            <Link href="/projects/activations/">activations</Link>, and{" "}
            <Link href="/projects/design/">posters</Link>. <br />
            If you are looking for my work as a full stack designer and ux engineer, please message me for a portfolio.
          </p>
        </section>
        <ProjectGrid projects={projects} />
      </main>
    </>
  );
}
