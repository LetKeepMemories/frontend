import { ReactNode, Suspense } from 'react';
import styles from './layout.module.css';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
