import { Nav } from "@/components/Nav";
import { AboutTabs } from "@/components/AboutTabs";

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
              <h1>Kirby</h1>
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
                <a href="mailto:kiamorakirby@gmail.com" className="icon-standard" aria-label="Email">
                  mail
                </a>
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
                <a target="_blank" rel="noopener noreferrer" href="https://x.com/kiamoraki" aria-label="X">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </li>
            </ul>
          }
          cv={
              <>
                <h3>Experience</h3>
                <ul>
                  <li>Digital Creative Director <a target="_blank" rel="noopener noreferrer" href="https://audiofemme.com">Audiofemme</a></li>
                  <li>Office Manager @ HEaT for <a href="https://burningman.org">The Burning Man Project</a></li>
                  <li>Virutal STEAM startup Co-Founder <a target="_blank" rel="noopener noreferrer" href="https://mars.radio">Mars.Radio</a></li>
                  <li>Front End Developer, <a href="https://cgp.com">C&G Partners</a></li>
                  <li>Product Designer, <a href="https://nasdaq.com">Nasdaq</a></li>
                  <li>Graphic Designer, <a href="https://taprootfoundation.org">Taproot Foundation</a></li>
                </ul>

                <h3>Teaching</h3>
                <ul>
                  <li>Professor @ <a href="https://mars.college">Mars College</a></li>
                  <li>Coach @ Mars Radio Cyber Arts Camp</li>
                  <li>Adobe Suite & Web Design @ <a href="https://thirdward.org">Third Ward</a></li>
                  <li>Web Design & Dev @ <a href="https://codenation.org/">Code Nation</a></li>
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
                  <li><span className="date">2020</span> Brahmain.ai / Art Residency in Bombay Beach / CA</li>
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
                  <li><strong>2025</strong> 200hr Yoga Teacher Training / Triguna Yoga School / Rishikesh / India</li>
                  <li><strong>2025</strong> 10 Day Vipassana Meditation Workshop / North Fork / CA</li>
                  <li><strong>2025</strong> 15hr Breathwork Coach Training Yoga Body</li>
                  <li><strong>2013-18</strong> School of Practical Philosophy / NYC</li>
                  <li><strong>2012</strong>MFA Design & Technology / Parsons The New School for Design / NYC</li>
                  <li><strong>2009</strong> BFA Fine Arts & Architecture / Miami University / Oxford / OH</li>
                </ul>

                <h3>Websites</h3>
                <ul>
                  <li><a href="https://audiofemme.com">Audiofemme</a> / Design & Dev</li>
                </ul>
              </>
            }
            timeline={
              <ol className="cv-timeline">
                <li>
                  <h4>2026</h4>
                  <ul>
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
                    <li>Bartender @ Dick &amp; Jane&rsquo;s</li>
                    <li>Digital Creative Director @ Audiofemme</li>
                    <li>&ldquo;Artificial Consciousnesse&rdquo; installed in Chelsea Music Venue for GlamTech</li>
                    <li>&ldquo;Portals&rdquo; solo show @ The West, Brooklyn</li>
                  </ul>
                </li>
                <li>
                  <h4>2017</h4>
                  <ul>
                    <li>Summer in Europe</li>
                    <li>Craft Cocktail Bartender at Dick &amp; Jane&rsquo;s</li>
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
                    <li>Product Designer @ Nasdaq OMX</li>
                  </ul>
                </li>
                <li>
                  <h4>2014</h4>
                  <ul>
                    <li>After studying Portuguese for 2 years, traveled to Brazil and explored Sao Paulo and Rio</li>
                    <li>Product Designer @ Nasdaq OMX</li>
                  </ul>
                </li>
                <li>
                  <h4>2013</h4>
                  <ul>
                    <li>Product Designer @ Nasdaq OMX</li>
                    <li>&ldquo;Wave Machine&rdquo; debuts at Oscillator in the Dublin Science Gallery</li>
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
