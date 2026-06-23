import styles from '@/styles/staticPage.module.css';

export const metadata = {
  title: 'Contact — Lets Keep Memories',
};

export default function Contact() {
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1>Get in touch</h1>
          <p>Questions, feedback, or just want to say hello? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose} style={{ textAlign: 'center' }}>
            <p>
              Email us at{' '}
              <a href="mailto:hello@letskeepmemory.com" className={styles.contactLink}>
                hello@letskeepmemory.com
              </a>{' '}
              and we&apos;ll get back to you as soon as we can.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
