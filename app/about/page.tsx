import { Nav } from "@/components/Nav";
import { AboutTabs } from "@/components/AboutTabs";
import { ContactButton } from "@/components/ContactButton";

export const metadata = { title: "About — Kirby" };

export default function AboutPage() {
  return (
    <>
      <Nav />
      <div id="about-bg-gradient" />
      <div id="about-bg-x" />

      <main className="about">
        <AboutTabs
          header={
            <>
              <div className="multi-stack">
                <span className="multi-prefix">Multi</span>
                <span className="multi-dash">—</span>
                <span className="multi-suffix">plicities</span>
                <span aria-hidden="true" />
                <span className="multi-dash">—</span>
                <span className="multi-suffix">verses</span>
                <span aria-hidden="true" />
                <span className="multi-dash">—</span>
                <span className="multi-suffix">dimensions</span>
                <span aria-hidden="true" />
                <span className="multi-dash">—</span>
                <span className="multi-suffix">tudes</span>
              </div>
            </>
          }
          socials={
            <ul className="socials">
              <li>
                {/* Was a plain `<a href="mailto:...">`. Replaced with
                    `<ContactButton />` which opens a modal contact form
                    in-page (form submission flows through Web3Forms).
                    The button keeps the same `.icon-standard` class so
                    it slots into the existing `.socials > li` grid
                    without any visual layout change. */}
                <ContactButton />
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.patreon.com/cw/kiamora" aria-label="Patreon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                    <rect x="2.5" y="3" width="3.5" height="18" />
                    <circle cx="15" cy="10" r="7" />
                  </svg>
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.mixcloud.com/kiamora/" aria-label="Mixcloud">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                    <ellipse cx="8" cy="18" rx="4.5" ry="3.3" transform="rotate(-22 8 18)" />
                    <rect x="11.2" y="4" width="1.6" height="14" />
                    <path d="M12.8 4 C 18 5.5 19 11 17 14 C 17.5 11 17 8 12.8 7.5 Z" />
                  </svg>
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://substack.com/@kiamora" aria-label="Substack">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4h18v2.5H3zm0 5h18v2.5H3zm0 5h18l-9 7z" />
                  </svg>
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://instagram.com/kirbliscious" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" fillRule="evenodd" aria-hidden="true">
                    <path d="M6 2 L18 2 A4 4 0 0 1 22 6 L22 18 A4 4 0 0 1 18 22 L6 22 A4 4 0 0 1 2 18 L2 6 A4 4 0 0 1 6 2 Z M12 6.5 A5.5 5.5 0 1 0 12 17.5 A5.5 5.5 0 1 0 12 6.5 Z M12 9 A3 3 0 1 0 12 15 A3 3 0 1 0 12 9 Z M17.5 5.4 A1.2 1.2 0 1 0 17.5 7.8 A1.2 1.2 0 1 0 17.5 5.4 Z" />
                  </svg>
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://x.com/kiamora__" aria-label="X">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/kiamoraki" aria-label="GitHub">
                  {/* GitHub mark — single filled path traced from the
                      official Octocat silhouette, sized to match the
                      18×18 footprint of the other social glyphs in the
                      column. `fill="currentColor"` so the icon picks
                      up the polarity-aware ink. */}
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12.05c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.55 0-.27-.01-.99-.02-1.95-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.78 2.7 1.26 3.36.96.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.29-5.24-5.74 0-1.27.45-2.31 1.18-3.12-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.2.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.51 3.18-1.2 3.18-1.2.62 1.59.23 2.77.11 3.06.74.81 1.18 1.85 1.18 3.12 0 4.46-2.69 5.45-5.26 5.74.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.21 0 .31.21.67.8.55 4.57-1.53 7.86-5.85 7.86-10.95C23.5 5.65 18.35.5 12 .5z" />
                  </svg>
                </a>
              </li>
            </ul>
          }
          cv={
              <>
                <h3>Experience</h3>
                <ul>
                  <li>Digital Creative Director @ <a target="_blank" rel="noopener noreferrer" href="https://audiofemme.com">Audiofemme</a></li>
                  <li>Office Manager @ HEaT for <a href="https://burningman.org">The Burning Man Project</a></li>
                  <li>Virtual STEAM startup Co-Founder <a target="_blank" rel="noopener noreferrer" href="https://kiamoraki.com/sites/marsradio/">Mars.Radio</a></li>
                  <li>Front End Developer / <a href="https://cgp.com">C&G Partners</a></li>
                  <li>Product Designer / <a href="https://nasdaq.com">Nasdaq</a></li>
                  <li>Graphic Designer / <a href="https://taprootfoundation.org">Taproot Foundation</a></li>
                </ul>

                <h3>Teaching</h3>
                <ul>
                  <li>Interdisciplinary Educator @ <a href="https://mars.college">Mars College</a></li>
                  <li>Coach @ <a href="https://kiamoraki.com/sites/marsradio/">Mars Radio Cyber Arts Camp</a></li>
                  <li>Adobe Suite & Web Design Instructor @ <a href="https://thirdward.org">Third Ward</a></li>
                  <li>Web Design & Dev Instructor @ <a href="https://codenation.org/">Code Nation</a></li>
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
                  <li><span className="date">2021-26</span> Mars.College / Art Residency in Bombay Beach / CA</li>
                  <li><span className="date">2020</span> Brahman.ai / Art Residency in Bombay Beach / CA</li>
                  <li><span className="date">2020</span> &ldquo;Roses&rdquo; / Bombay Beach / CA</li>
                  <li><span className="date">2019</span> &ldquo;TOBRIT&rdquo; / Burning Man</li>
                  <li><span className="date">2019</span> &ldquo;Artificial Consciousness&rdquo; / Glamtech / Chelsea Music Venue / NYC</li>
                  <li><span className="date">2019</span> &ldquo;RadioactiviTEA&rdquo; / The Night Market / NYC</li>
                  <li><span className="date">2018</span> &ldquo;Mandalas&rdquo; / Moonshot</li>
                  <li><span className="date">2018</span> &ldquo;Portals&rdquo; / The West BK</li>
                  <li><span className="date">2016</span> &ldquo;The Eternal Return&rdquo; / Robot Church / NYC</li>
                  <li><span className="date">2015</span> &ldquo;Precarity: A Domestic Tale&rdquo; / Rooms to Let / Cleveland</li>
                  <li><span className="date">2013</span> &ldquo;Wave Machine&rdquo; / Oscillator / Dublin Science Gallery</li>
                </ul>

                <h3>Study</h3>
                <ul>
                  <li><strong>2026</strong> Levels I & II: Four and Six-Fold Patterns / <a href="https://deenarts.org">Deen Arts Foundation</a></li>
                  <li><strong>2025</strong> 200hr Yoga Teacher Training / <a href="https://trigunayoga.com">Triguna Yoga School</a> / Rishikesh / India</li>
                  <li><strong>2025</strong> 10 Day <a href="https://www.dhamma.org/en-us/meditation-courses/vipassana-meditation-course/">Vipassana Meditation Workshop</a> / North Fork / CA</li>
                  <li><strong>2025</strong> 15hr Breathwork Coach Training <a href="https://yogabody.com">Yoga Body</a></li>
                  <li><strong>2013-18</strong> <a href="https://schoolofpracticalphilosophy.org">School of Practical Philosophy</a> / NYC</li>
                  <li><strong>2012</strong> MFA Design & Technology / <a href="https://parsons.edu">Parsons The New School for Design</a> / NYC</li>
                  <li><strong>2009</strong> BFA Architecture + Interdisciplinary Studies / <a href="https://miamioh.edu">Miami University</a> / Oxford / OH</li>
                </ul>

                <h3>Website Design & Builds</h3>
                <ul>
                  <li><a href="https://audiofemme.com">Audiofemme</a></li>
                  <li><a href="https://kiamoraki.com/sites/marsradio/">Mars.Radio</a></li>
                  <li><a href="https://kiamoraki.com/sites/xtian.dev/">Xtian.dev</a></li>
                  <li><a href="https://kiamoraki.com/sites/eos/eos-demo-site/index.html">EOS.org</a> (Desktop only)</li>
                  <li><a href="https://neptune.kiamoraki.com">Neptune</a></li>
                  <li><a href="https://kiamoraki.com/sites/slabz/">Slabz</a></li>
                </ul>
              </>
            }
            timeline={
              <ol className="cv-timeline">
                <li>
                  <h4>2026</h4>
                  <ul>
                    <li>Office Manager @ HEaT for The Burning Man Project</li>
                    <li>10day Vipassana Service Period @ <a href="https://www.dhamma.org/en-us/meditation-courses/vipassana-meditation-course/">Dhama Pasavana</a></li>
                    <li>OG camp founder &amp; lead to 20 new Martians @ <a href="https://mars.college">Mars College</a> high–tech low–cost off–grid art residency</li>
                    <li>DJ @ Sub Club, Bliss Club &amp; Mars College</li>
                    <li><a href="https://www.bombaybeachbiennale.org/">Bombay Beach Biennale</a> Artist Liaison</li>
                    <li>Site rebrand for <a href="audiofemme.com">Audiofemme</a></li>
                    <li>Founded the <a href="https://neptune.kiamoraki.com">Neptune</a> artist residency and gallery in Bombay Beach, CA. Hosted artists Ria Rajan and works by Sophie Kravitz and Tracey Keilly</li>
                    <li>Yoga Teacher</li>
                  </ul>
                </li>
                <li>
                  <h4>2025</h4>
                  <ul>
                    <li>200hr Yoga Teacher Training <a href="https://trigunayoga.com">Triguna Yoga</a> in Rishikesh, India</li>
                    <li>10day <a href="https://www.dhamma.org/en-us/meditation-courses/vipassana-meditation-course/">Vipassana Meditation</a> Workshop</li>
                    <li>15hr Breathwork Coach Training with <a href="https://yogabody.com">Yoga Body</a></li>
                    <li>
                      Became a homeowner of{" "}
                      <a target="_blank" rel="noopener noreferrer" href="https://neptune.kiamoraki.com">
                        Neptune
                      </a>
                    </li>
                    <li><a href="https://mars.college">Mars College</a> – Electric Lounge Camp Lead</li>
                    <li>Office Manager @ HEaT for The Burning Man Project</li>
                  </ul>
                </li>
                <li>
                  <h4>2024</h4>
                  <ul>
                    <li>Mars College</li>
                    <li>Coachella stage build for The DoLab</li>
                    <li>Office Manager @ HEaT for The Burning Man Project</li>
                  </ul>
                </li>
                <li>
                  <h4>2023</h4>
                  <ul>
                    <li>Mars College – Produced 3 months of Moon Raves</li>
                    <li>Founded Fake Rekordz</li>
                    <li>Traveled to Istanbul and studied islamic patterns &amp; architecture</li>
                    <li>Assistant Office Manager @ HEaT for The Burning Man Project</li>
                  </ul>
                </li>
                <li>
                  <h4>2022</h4>
                  <ul>
                    <li>Mars College &mdash; Chatsubo RA</li>
                    <li>Led seminar in Energy studies</li>
                    <li>LiB Sign Painting for The DoLab</li>
                  </ul>
                </li>
                <li>
                  <h4>2021</h4>
                  <ul>
                    <li>Mars College</li>
                    <li>Renegade Burn</li>
                    <li>Became a Van Lifer</li>
                  </ul>
                </li>
                <li>
                  <h4>2020</h4>
                  <ul>
                    <li>Brahman.ai art residency</li>
                    <li>Accidentally Moved to California</li>
                    <li>Mars.Radio Co-Founder</li>
                    <li>Joined House of Meow</li>
                    <li>&ldquo;Roses&rdquo; displayed in The Portal, Bombay Beach, CA</li>
                  </ul>
                </li>
                <li>
                  <h4>2019</h4>
                  <ul>
                    <li>Temple of Brad Pitt Fresco painter @ Burning Man for Disorient</li>
                    <li>Gardener for Rebecca Cole Grows</li>
                    <li>Dance Parade art car wrangler, NYC</li>
                    <li>Collaborated on&ldquo;RadioactiviTEA&rdquo; an immersive box truck experience part of The Night Market, NYC</li>
                  </ul>
                </li>
                <li>
                  <h4>2018</h4>
                  <ul>
                    <li>Joined Disorient &amp; attended Burning Man</li>
                    <li>Digital Creative Director @ Audiofemme</li>
                    <li>&ldquo;Artificial Consciousnesse&rdquo; installed in Chelsea Music Venue for GlamTech</li>
                    <li>&ldquo;Portals&rdquo; solo show @ The West, Brooklyn</li>
                  </ul>
                </li>
                <li>
                  <h4>2017</h4>
                  <ul>
                    <li>Summer in Europe</li>
                  </ul>
                </li>
                <li>
                  <h4>2016</h4>
                  <ul>
                    <li>Craft Cocktail Bartender at Dick &amp; Jane&rsquo;s</li>
                    <li>First burn with the Philly Guild</li>
                  </ul>
                </li>
                <li>
                  <h4>2015</h4>
                  <ul>
                    <li>Producer for The Open Mic Tour, a traveling troupe of comedians</li>
                    <li>Traveled across the country, twice</li>
                    <li>Sound design & animation for &ldquo;Precarity: A Domestic Tale&rdquo; an installation part of Rooms to Let in Cleveland, OH</li>
                  </ul>
                </li>
                <li>
                  <h4>2014</h4>
                  <ul>
                    <li>After studying Portuguese for 2 years, traveled to Brazil and explored Sao Paulo and Rio</li>
                  </ul>
                </li>
                <li>
                  <h4>2013</h4>
                  <ul>
                    <li>Product Designer @ Nasdaq OMX</li>
                    <li>&ldquo;Wave Machine&rdquo; debuts at Oscillator in the Dublin Science Museum</li>
                  </ul>
                </li>
                <li>
                  <h4>2012</h4>
                  <ul>
                    <li>MFA Design &amp; Technology from Parsons, The New School in NYC</li>
                    <li>&ldquo;The Eternal Return&rdquo; debuts in the Kellen Art Gallery, NYC</li>
                  </ul>
                </li>
                <li>
                  <h4>2010</h4>
                  <ul>
                    <li>Moved to Brooklyn, NY</li>
                  </ul>
                </li>
                <li>
                  <h4>2009</h4>
                  <ul>
                    <li>BFA in Fine Arts &amp; Architecture, Minor in Interdisciplinary Studies, Miami University of Ohio</li>
                  </ul>
                </li>
                <li>
                  <h4>2007</h4>
                  <ul>
                    <li>Summer study abroad in London</li>
                  </ul>
                </li>
                <li>
                  <h4>2006</h4>
                  <ul>
                    <li>Summer in Beijing getting fat on Dumplings</li>
                    <li>Venezuelan Student for Peace and Justice Trip</li>
                  </ul>
                </li>
                <li>
                  <h4>2005</h4>
                  <ul>
                    <li>Kenya excursion with Willis Okech and 12 friends</li>
                  </ul>
                </li>
                <li>
                  <h4>2003</h4>
                  <ul>
                    <li>Orange High School graduate</li>
                  </ul>
                </li>
              </ol>
            }
        />
      </main>
    </>
  );
}
