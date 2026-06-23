import styles from '@/styles/staticPage.module.css';

export const metadata = {
  title: 'Privacy Policy — Lets Keep Memories',
};

export default function Privacy() {
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1>Privacy Policy</h1>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose}>
            <div className={styles.note}>
              Lets Keep Memories is an early-stage product and this page is a placeholder while our full
              privacy policy is finalized. If you have questions about your data in the meantime,
              email <a href="mailto:hello@letskeepmemory.com" className={styles.contactLink}>hello@letskeepmemory.com</a>.
            </div>

            <h2>What we collect</h2>
            <p>
              When you create an account, we store your name, email address, and password (encrypted).
              When you create an occasion, we store the details you provide and any photos, videos, or
              messages submitted by your guests.
            </p>

            <h2>How we use it</h2>
            <p>
              We use this information to operate the service: to authenticate you, to display your
              occasions and the messages left on them, and to send account-related emails like
              verification and password reset links.
            </p>

            <h2>Sharing</h2>
            <p>
              We don&apos;t sell your data. Media you upload is stored with our infrastructure
              providers solely to serve it back to you and your guests.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
