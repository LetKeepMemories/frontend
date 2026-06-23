import { ReactNode, Suspense } from 'react';
import styles from '../dashboard/layout.module.css';
import Sidebar from '../dashboard/Sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.dashboardLayout}>
      <Suspense fallback={<div className={styles.sidebar}>Loading sidebar...</div>}>
        <Sidebar />
      </Suspense>
      <div className={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
