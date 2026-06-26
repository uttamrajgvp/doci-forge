import { useNavigate } from 'react-router-dom';
import {
  FileEdit,
  Layers,
  Combine,
  Shield,
  Zap,
  Download,
  ArrowRight,
  CheckCircle2,
  Anvil,
  Monitor,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import styles from './Landing.module.css';

const FEATURES = [
  {
    icon: FileEdit,
    title: 'Precision Editing',
    desc: 'Edit text, images, and layouts while preserving the original PDF formatting — fonts, colors, and spacing stay intact.',
  },
  {
    icon: Layers,
    title: 'Bulk Generation',
    desc: 'Upload a template PDF + CSV/Excel. Map fields visually, generate hundreds of personalized PDFs in seconds.',
  },
  {
    icon: Combine,
    title: 'Merge & Split',
    desc: 'Combine multiple PDFs, reorder pages, extract specific ranges — all with drag-and-drop simplicity.',
  },
  {
    icon: Shield,
    title: '100% Private',
    desc: 'Every operation runs in your browser. Files never leave your device. No server uploads, no data collection.',
  },
  {
    icon: Zap,
    title: 'Blazing Fast',
    desc: 'Web Workers handle heavy processing in the background. Your UI stays responsive even with 100+ page documents.',
  },
  {
    icon: Download,
    title: 'No Installation',
    desc: 'Open your browser and start editing. No app to install, no account to create, no subscriptions.',
  },
];

const CAPABILITIES = [
  'Text editing with font & color preservation',
  'Image and logo replacement',
  'Annotations: highlights, stamps, signatures',
  'Form field detection and editing',
  'Redaction for sensitive content',
  'Bulk PDF generation from CSV/Excel',
  'Page reorder, merge, and split',
  'Template save & reuse',
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <div className={styles.logoMark}>
              <Anvil size={20} />
            </div>
            <span className={styles.logoText}>PDF Forge</span>
          </div>
          <div className={styles.navRight}>
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowRight size={16} />}
            >
              Open App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Shield size={14} />
            <span>100% Client-Side — Your Files Never Leave Your Device</span>
          </div>
          <h1 className={styles.heroTitle}>
            The PDF Editor That
            <span className={styles.gradient}> Works Like Magic</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Edit, annotate, merge, and bulk-generate PDFs with pixel-perfect precision.
            Everything runs in your browser — no uploads, no servers, no compromises.
          </p>
          <div className={styles.heroCtas}>
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              iconRight={<ArrowRight size={18} />}
            >
              Start Editing — It's Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/editor')}
              icon={<Monitor size={18} />}
            >
              Try the Editor
            </Button>
          </div>
          <p className={styles.heroNote}>No account required. No file size limits.</p>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual}>
          <div className={styles.editorPreview}>
            <div className={styles.previewToolbar}>
              <div className={styles.previewDots}>
                <span /><span /><span />
              </div>
              <span className={styles.previewTitle}>invoice_2026.pdf</span>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewPage}>
                <div className={styles.previewLine} style={{ width: '40%', height: 14 }} />
                <div className={styles.previewLine} style={{ width: '65%', height: 10 }} />
                <div className={styles.previewLine} style={{ width: '55%', height: 10 }} />
                <div className={styles.previewSpacer} />
                <div className={styles.previewBlock}>
                  <div className={styles.previewLine} style={{ width: '30%', height: 8 }} />
                  <div className={styles.previewLine} style={{ width: '80%', height: 8 }} />
                  <div className={styles.previewLine} style={{ width: '60%', height: 8 }} />
                </div>
                <div className={styles.previewSpacer} />
                <div className={styles.previewHighlight}>
                  <div className={styles.previewLine} style={{ width: '45%', height: 10, background: 'var(--color-primary)' }} />
                </div>
                <div className={styles.previewLine} style={{ width: '75%', height: 8 }} />
                <div className={styles.previewLine} style={{ width: '50%', height: 8 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Everything You Need, Nothing You Don't</h2>
          <p className={styles.sectionSubtitle}>
            A complete PDF toolkit that respects your privacy and your time.
          </p>

          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <f.icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className={styles.capabilities}>
        <div className={styles.sectionContent}>
          <div className={styles.capGrid}>
            <div className={styles.capLeft}>
              <h2 className={styles.sectionTitle}>Built for Power Users</h2>
              <p className={styles.sectionSubtitle}>
                From simple text edits to generating thousands of personalized documents —
                PDF Forge handles it all without breaking a sweat.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                iconRight={<ArrowRight size={18} />}
              >
                Get Started
              </Button>
            </div>
            <div className={styles.capRight}>
              <ul className={styles.capList}>
                {CAPABILITIES.map((cap) => (
                  <li key={cap} className={styles.capItem}>
                    <CheckCircle2 size={18} className={styles.capCheck} />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Forge Better PDFs?</h2>
          <p className={styles.ctaSubtitle}>
            No sign-up. No download. Just open and edit.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            iconRight={<ArrowRight size={18} />}
          >
            Launch PDF Forge
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Anvil size={18} />
            <span>PDF Forge</span>
          </div>
          <p className={styles.footerNote}>
            100% open-source. 100% client-side. Built with privacy in mind.
          </p>
        </div>
      </footer>
    </div>
  );
}
