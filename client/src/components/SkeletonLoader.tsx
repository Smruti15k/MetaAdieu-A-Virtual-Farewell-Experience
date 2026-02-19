import styles from './SkeletonLoader.module.css';

export const DashboardSkeleton = () => (
    <div className={styles.dashContainer}>
        {/* Header skeleton */}
        <div className={styles.dashHeader}>
            <div className={styles.textBlock} style={{ width: '260px', height: '32px' }} />
            <div className={styles.dashActions}>
                <div className={styles.btnSkeleton} style={{ width: '160px' }} />
                <div className={styles.btnSkeleton} style={{ width: '80px' }} />
            </div>
        </div>
        {/* Card grid */}
        <div className={styles.dashGrid}>
            {[1, 2, 3].map(i => (
                <div key={i} className={styles.cardSkeleton}>
                    <div className={styles.cardHeaderSkeleton}>
                        <div className={styles.textBlock} style={{ width: '65%', height: '20px' }} />
                        <div className={styles.textBlock} style={{ width: '80px', height: '18px' }} />
                    </div>
                    <div className={styles.textBlock} style={{ width: '55%', height: '16px', marginTop: '1rem' }} />
                    <div className={styles.cardActionsSkeleton}>
                        <div className={styles.btnSkeleton} style={{ flex: 1 }} />
                        <div className={styles.btnSkeleton} style={{ flex: 1 }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const EventRoomSkeleton = () => (
    <div className={styles.eventContainer}>
        {/* Header banner */}
        <div className={styles.eventHeader}>
            <div className={styles.textBlock} style={{ width: '50%', height: '40px', marginBottom: '0.75rem' }} />
            <div className={styles.textBlock} style={{ width: '35%', height: '18px', marginBottom: '0.5rem' }} />
            <div className={styles.textBlock} style={{ width: '40%', height: '14px' }} />
        </div>
        {/* Tabs */}
        <div className={styles.tabsSkeleton}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={styles.tabSkeleton} />
            ))}
        </div>
        {/* Content area */}
        <div className={styles.contentSkeleton}>
            <div className={styles.mainSkeleton}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className={styles.memoryCardSkeleton} />
                ))}
            </div>
            <div className={styles.sidebarSkeleton}>
                <div className={styles.textBlock} style={{ width: '100px', height: '20px', marginBottom: '1rem' }} />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.chatLine}>
                        <div className={styles.textBlock} style={{ width: '60px', height: '14px' }} />
                        <div className={styles.textBlock} style={{ width: '80%', height: '14px' }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
