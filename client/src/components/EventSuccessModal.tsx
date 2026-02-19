import { useState, useEffect } from 'react';
import styles from './EventSuccessModal.module.css';

interface EventSuccessModalProps {
    eventId: string;
    eventTitle: string;
    onGoToDashboard: () => void;
    onCreateAnother: () => void;
}

const EventSuccessModal = ({
    eventId,
    eventTitle,
    onGoToDashboard,
    onCreateAnother,
}: EventSuccessModalProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(eventId);
            setCopied(true);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = eventId;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
        }
    };

    useEffect(() => {
        if (copied) {
            const t = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(t);
        }
    }, [copied]);

    // prevent scrolling while modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className={styles.overlay}>
            {/* Confetti burst */}
            <div className={styles.confettiBurst}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} />
                ))}
            </div>

            <div className={styles.card}>
                {/* Floating particles */}
                <div className={styles.particles}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.particle} />
                    ))}
                </div>

                {/* Animated check icon */}
                <div className={styles.iconWrap}>
                    <div className={styles.iconRing} />
                    <div className={styles.iconCircle}>
                        <svg className={styles.checkmark} viewBox="0 0 40 40">
                            <polyline points="10,22 18,30 30,12" />
                        </svg>
                    </div>
                </div>

                <h2 className={styles.title}>Event Created! 🎉</h2>
                <p className={styles.subtitle}>
                    <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{eventTitle}</strong> is
                    ready to go.
                </p>
                <p className={styles.subtitle}>
                    Share the event ID with your guests so they can join.
                </p>

                {/* Copyable ID badge */}
                <div className={styles.idBadge} onClick={handleCopy} title="Click to copy">
                    <span className={styles.idLabel}>ID</span>
                    <span>{eventId}</span>
                    <svg className={styles.copyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    {copied && <span className={styles.copiedTooltip}>Copied!</span>}
                </div>

                {/* Action buttons */}
                <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={onCreateAnother}>
                        Create Another
                    </button>
                    <button className={styles.btnPrimary} onClick={onGoToDashboard}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventSuccessModal;
