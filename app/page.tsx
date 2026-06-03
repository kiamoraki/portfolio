import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ProjectGrid } from "@/components/ProjectGrid";
import { getAllProjects } from "@/lib/projects";

export default function Home() {
  const projects = getAllProjects().filter((p) => !p.hidden && !p.meta);

  return (
    <>
      {/* Mirror the project-page inline `<style>` that writes
          `--chrome-scrim` directly onto body — without this, the CV
          chip on the homepage paints transparent (the project-page
          chrome chips all carry the off-white scrim because that
          page sets the variable in its inline style). Light-mode
          scrim derives from `--color-light` via `color-mix` so the
          off-white tone of the rest of the palette tracks through. */}
      <style>{`body{--chrome-scrim:color-mix(in srgb, var(--color-light) 85%, transparent);}`}</style>
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
