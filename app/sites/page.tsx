import { Nav } from "@/components/Nav";

export const metadata = { title: "Old Websites — Kirby" };

const sites = [
  {
    name: "EOS",
    description: "A demo site and design & data project.",
    links: [
      { label: "Demo Site", href: "/sites/eos/eos-demo-site/" },
      { label: "Design & Data", href: "/sites/eos/Design & Data/" },
    ],
  },
  {
    name: "Mars Radio",
    description: "A Jekyll-based website with blog and custom layouts.",
    links: [{ label: "View Site", href: "/sites/marsradio/" }],
  },
  {
    name: "Xtian.dev",
    description: "A PHP-based personal website with custom styling.",
    links: [{ label: "View Site", href: "/sites/xtian.dev/" }],
  },
  {
    name: "Jessie D Mees",
    description: "A portfolio website with works showcase and about page.",
    links: [{ label: "View Site", href: "/sites/jessiedmees/" }],
  },
];

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function SitesPage() {
  return (
    <>
      <Nav />
      <main>
        <div className="sites-container">
          <h1>Old Websites</h1>
          <p>A collection of websites I&apos;ve built over the years.</p>

          <div className="sites-grid">
            {sites.map((site) => (
              <div key={site.name} className="site-card">
                <h2>{site.name}</h2>
                <p>{site.description}</p>
                <div className="site-links">
                  {site.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                      <span>{link.label}</span>
                      <ExternalIcon />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
