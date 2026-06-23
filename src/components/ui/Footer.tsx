import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink}>
            <picture>
              <source srcSet="/logos/logo-dark.jpg" media="(prefers-color-scheme: dark)" />
              <Image
                src="/logos/logo-light.jpg"
                alt="Lets Keep Memories Logo"
                width={150}
                height={30}
                className={styles.logo}
              />
            </picture>
          </Link>
          <p className={styles.description}>
            Preserve life moments, celebrate milestones, and create lasting digital collections of messages, images, videos, and voice memories.
          </p>
        </div>
        
        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <h4>Product</h4>
            <Link href="/pricing">Pricing</Link>
            <Link href="/features">Features</Link>
          </div>
          <div className={styles.linkGroup}>
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className={styles.linkGroup}>
            <h4>Legal</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Lets Keep Memories. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
