import { Nav } from "@/components/Nav";

export const metadata = { title: "About — Kirby" };

export default function AboutPage() {
  return (
    <>
      <Nav />
      <div id="about-bg-gradient" />
      <div id="about-bg-x" />

      <main>
        <section id="about-info">
          <h1>Kirby</h1>
          <ul className="socials">
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://instagram.com/kirbliscious" className="icon-social" aria-label="Instagram">
                {""}
              </a>
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/kirbliscious" className="icon-social" aria-label="Twitter">
                twitter
              </a>
            </li>
            <li>
              <a href="mailto:michelle@kirby.fail" className="icon-standard" aria-label="Email">
                mail
              </a>
            </li>
          </ul>
        </section>

        <section id="about-cv">
          <div>
            <ul>
              <li>Artist</li>
              <li>Creator of Immersive Installations & Interactive Arts</li>
              <li>Lover of the Multi -plicities -verses -dimensions & -tudes</li>
            </ul>
          </div>

          <h3>Bio</h3>
          <p>
            <strong>Welcome!</strong> to this projection of form and function doused in Kirby spice.
            I hope you find everything you are looking for (& discover more than you think there is).
            I&apos;ve built and destroyed many of my creations — here&apos;s hoping this site stands the test of (some) time.
          </p>
          <p>Each Mandala is a lovingly created meditation, uniquely made for an individual.</p>

          <h3>Education</h3>
          <ul>
            <li><strong>MFA Design & Technology</strong> — Parsons The New School for Design</li>
            <li><strong>BFA Fine Arts & Architecture</strong> — Miami University of Ohio</li>
          </ul>

          <h3>Experience</h3>
          <ul>
            <li>Product Designer, <a target="_blank" rel="noopener noreferrer" href="https://audiofemme.com">Audiofemme</a></li>
            <li>Product Designer, <a target="_blank" rel="noopener noreferrer" href="https://mars.radio">Mars.Radio</a></li>
            <li>Front End Developer, C&G Partners</li>
            <li>Product Designer, Nasdaq OMX</li>
          </ul>

          <h3>Teaching</h3>
          <ul>
            <li>Coach @ the Mars.College Cyber Arts Camp</li>
            <li>Adobe Suite & Web Design @ Third Ward</li>
            <li>Web Design & Dev @ ScriptEd</li>
            <li>Arts Mentor @ Free Arts NYC</li>
          </ul>

          <h3>Speaking Engagements</h3>
          <ul>
            <li>UX Craftsmanship / UXDC</li>
            <li><a target="_blank" rel="noopener noreferrer" href="https://www2.slideshare.net/MichelleRuthKirby/designing-enterprise-software">Designing Enterprise Software</a> / Prodesign</li>
            <li><a target="_blank" rel="noopener noreferrer" href="https://www2.slideshare.net/MichelleRuthKirby/lean-ux-78453380">Lean UX</a></li>
            <li>User Experience Design 101 / Dev Bootcamp NYC</li>
          </ul>

          <h3>Selected Exhibitions & Residencies</h3>
          <ul>
            <li><span className="date">2020</span> Brahmain.ai (Residency)</li>
            <li><span className="date">2020</span> &ldquo;Roses&rdquo; / Bombay Beach</li>
            <li><span className="date">2019</span> &ldquo;TOBRIT&rdquo; / Burning Man</li>
            <li><span className="date">2019</span> &ldquo;Artificial Consciousness&rdquo; / Glamtech / Chelsea Music Venue</li>
            <li><span className="date">2019</span> &ldquo;RadioactiviTEA&rdquo; / The Night Market / NYC</li>
            <li><span className="date">2018</span> &ldquo;Mandalas&rdquo; / Moonshot</li>
            <li><span className="date">2018</span> &ldquo;Portals&rdquo; / The West BK</li>
            <li><span className="date">2016</span> &ldquo;The Eternal Return&rdquo; / Robot Church / NYC</li>
            <li><span className="date">2015</span> &ldquo;Precarity: A Domestic Tale&rdquo; / Rooms to Let / Cleveland</li>
            <li><span className="date">2013</span> &ldquo;Wave Machine&rdquo; / Oscillator / Dublin Science Gallery</li>
          </ul>

          <p className="copyright"><small>© Michelle Kirby</small></p>
        </section>
      </main>
    </>
  );
}
