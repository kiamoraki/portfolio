import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <div style={{ textAlign: "center", margin: "3rem auto", maxWidth: 600 }}>
          <h1 style={{ fontSize: "4em", margin: "30px 0" }}>404</h1>
          <p><strong>Page not found :(</strong></p>
          <p>The requested page could not be found.</p>
        </div>
      </main>
    </>
  );
}
