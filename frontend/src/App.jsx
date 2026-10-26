import { useAuth } from "./context/AuthContext.jsx";
import Whiteboard from "./components/Whiteboard.jsx";
import {
  Zap,
  Infinity as InfinityIcon,
  Download,
  MousePointer2,
  Share2,
} from "lucide-react";
import styles from "./App.module.css";

const App = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.landingPage}>
        {/* Navigation Bar */}
        <header className={styles.navbar}>
          <div className={styles.navContainer}>
            <div className={styles.navBrand}>
              <svg
                className={styles.brandLogo}
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="2" y="2" width="12" height="12" rx="3.5" fill="#3b82f6" />
                <rect x="18" y="2" width="12" height="12" rx="3.5" fill="#6366f1" />
                <rect x="2" y="18" width="12" height="12" rx="3.5" fill="#6366f1" opacity="0.8" />
                <rect x="18" y="18" width="12" height="12" rx="3.5" fill="#3b82f6" opacity="0.8" />
              </svg>
              <span className={styles.brandName}>CrewBoard</span>
            </div>

            <nav className={styles.navActions}>
              <a
                href="https://github.com/thePranav-kpk/crewboard-app"
                target="_blank"
                rel="noreferrer"
                className={styles.githubLink}
                aria-label="View source on GitHub"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span>GitHub</span>
              </a>
              <button onClick={login} className={styles.navLoginBtn}>
                Sign in
              </button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className={styles.heroSection}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <span>v1.0 is now live — Real-time whiteboard</span>
          </div>

          <h1 className={styles.heroHeadline}>
            Where creative ideas <br />
            <span className={styles.heroHeadlineHighlight}>take shape, together.</span>
          </h1>

          <p className={styles.heroSubheadline}>
            An infinite collaborative canvas for teams to brainstorm, sketch system architecture,
            and design in real time with live peer cursors.
          </p>

          <div className={styles.ctaGroup}>
            <button
              id="hero-google-login-btn"
              onClick={login}
              className={styles.primaryCtaBtn}
              aria-label="Sign in with Google"
            >
              <svg
                className={styles.googleIcon}
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <span className={styles.ctaSubtext}>Free & open source • Zero setup • Works in any browser</span>
          </div>

          {/* Interactive Showcase Mockup */}
          <div className={styles.mockupWrapper}>
            <div className={styles.mockupWindow}>
              {/* Window Header */}
              <div className={styles.mockupTitleBar}>
                <div className={styles.mockupWindowButtons}>
                  <span className={`${styles.windowDot} ${styles.dotRed}`} />
                  <span className={`${styles.windowDot} ${styles.dotYellow}`} />
                  <span className={`${styles.windowDot} ${styles.dotGreen}`} />
                </div>
                <div className={styles.mockupRoomTag}>
                  <span>general-room</span>
                </div>
                <div className={styles.mockupHeaderActions}>
                  <span className={styles.mockupShareBtn}>
                    <Share2 size={12} /> Share
                  </span>
                </div>
              </div>

              {/* Canvas Preview Body */}
              <div className={styles.mockupCanvas}>
                {/* Vector Diagram Sketches */}
                <svg className={styles.canvasSketch} viewBox="0 0 700 320" fill="none">
                  {/* Auth Node */}
                  <rect x="60" y="80" width="140" height="70" rx="10" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5 5" fill="rgba(59, 130, 246, 0.08)" />
                  <text x="130" y="122" fill="#93c5fd" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Auth Service</text>

                  {/* Arrow 1 */}
                  <path d="M200 115 L310 115" stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrow)" />
                  <polygon points="310,115 302,110 302,120" fill="#60a5fa" />

                  {/* Engine Node */}
                  <rect x="315" y="65" width="160" height="100" rx="12" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139, 92, 246, 0.12)" />
                  <text x="395" y="112" fill="#c4b5fd" fontSize="15" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">WebSocket Sync</text>
                  <text x="395" y="134" fill="#a78bfa" fontSize="12" textAnchor="middle" fontFamily="sans-serif">60 FPS Real-Time</text>

                  {/* Arrow 2 */}
                  <path d="M475 115 L570 115" stroke="#a78bfa" strokeWidth="2" />
                  <polygon points="570,115 562,110 562,120" fill="#a78bfa" />

                  {/* Database Node */}
                  <rect x="575" y="80" width="130" height="70" rx="10" stroke="#10b981" strokeWidth="2.5" fill="rgba(16, 185, 129, 0.08)" />
                  <text x="640" y="122" fill="#6ee7b7" fontSize="14" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Room Memory</text>

                  {/* Freehand note annotation */}
                  <path d="M340 210 Q370 230 430 205" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  <text x="385" y="245" fill="#fcd34d" fontSize="13" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">Multiplayer canvas pipeline</text>
                </svg>

                {/* Floating Peer Cursors */}
                <div className={`${styles.peerCursor} ${styles.cursorSarah}`} style={{ left: "25%", top: "35%" }}>
                  <MousePointer2 size={16} fill="#3b82f6" color="#3b82f6" />
                  <span className={styles.cursorTag} style={{ backgroundColor: "#3b82f6" }}>Lithesh (Design)</span>
                </div>

                <div className={`${styles.peerCursor} ${styles.cursorAlex}`} style={{ left: "58%", top: "25%" }}>
                  <MousePointer2 size={16} fill="#8b5cf6" color="#8b5cf6" />
                  <span className={styles.cursorTag} style={{ backgroundColor: "#8b5cf6" }}>Pranav (Dev)</span>
                </div>

                <div className={`${styles.peerCursor} ${styles.cursorYou}`} style={{ left: "78%", top: "52%" }}>
                  <MousePointer2 size={16} fill="#10b981" color="#10b981" />
                  <span className={styles.cursorTag} style={{ backgroundColor: "#10b981" }}>You</span>
                </div>

                {/* Mini Floating Bottom Toolbar Preview */}
                <div className={styles.mockupToolbar}>
                  <span className={styles.mockupToolDot} style={{ background: "#3b82f6" }} />
                  <span className={styles.mockupToolPill} />
                  <span className={styles.mockupToolPill} />
                  <span className={styles.mockupToolDivider} />
                  <span className={styles.mockupToolDot} style={{ background: "#ef4444" }} />
                  <span className={styles.mockupToolDot} style={{ background: "#10b981" }} />
                  <span className={styles.mockupToolDot} style={{ background: "#f59e0b" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Value Props & Features Grid */}
          <section className={styles.featuresSection}>
            <div className={styles.featuresHeader}>
              <h2 className={styles.featuresTitle}>Built for speed, precision, and collaboration</h2>
              <p className={styles.featuresSubtitle}>
                Everything you need to turn thoughts into shared architecture without friction.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <Zap size={20} className={styles.featureIconBlue} />
                </div>
                <h3 className={styles.cardHeading}>60 FPS Real-Time Sync</h3>
                <p className={styles.cardText}>
                  Low-latency WebSocket streaming ensures all peer strokes, live cursors, and movements update instantaneously across your entire team.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <InfinityIcon size={20} className={styles.featureIconIndigo} />
                </div>
                <h3 className={styles.cardHeading}>Unbounded Infinite Canvas</h3>
                <p className={styles.cardText}>
                  Never run out of space. Fluid multi-touch trackpad gestures, high-precision zooming, and world-coordinate transformations.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <Download size={20} className={styles.featureIconGreen} />
                </div>
                <h3 className={styles.cardHeading}>Retina Export Engine</h3>
                <p className={styles.cardText}>
                  Export your boards to 2x Retina PNGs with customizable background themes or copy vector images directly to your system clipboard.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <span className={styles.footerBrand}>CrewBoard</span>
            <span className={styles.footerText}>
              Open-source collaborative whiteboard. Built for engineers & designers.
            </span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <Whiteboard />
    </div>
  );
};

export default App;
