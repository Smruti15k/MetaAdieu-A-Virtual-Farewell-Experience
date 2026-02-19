import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinEvent.module.css';

const JoinEvent = () => {
    const [name, setName] = useState('');
    const [eventId, setEventId] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let targetId = eventId.trim();
        // Handle full URL paste
        if (targetId.includes('/event/')) {
            const parts = targetId.split('/event/');
            targetId = parts[1];
        }

        if (name.trim() && targetId) {
            // Save guest info to local storage
            const guestUser = {
                name: name.trim(),
                isGuest: true,
                id: 'guest-' + Date.now() // temporary ID
            };
            localStorage.setItem('user', JSON.stringify(guestUser));
            navigate(`/event/${targetId}`);
        } else {
            alert("Please enter both Name and Event ID");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Left Side: Form */}
                <div className={styles.formSection}>
                    <div onClick={() => navigate('/')} className={styles.backLink}>
                        ← Back to Home
                    </div>

                    <div className={styles.card}>
                        <div>
                            <h2 className={styles.title}>Join Event</h2>
                            <p className={styles.subtitle}>Enter the event details to join the celebration.</p>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Display Name</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name (e.g. Alex)"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Event ID or Link</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={eventId}
                                    onChange={(e) => setEventId(e.target.value)}
                                    placeholder="Paste Event ID or Link"
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Join Event</button>
                        </form>

                        <p className={styles.guestNote}>
                            * No account required to join as a guest.
                        </p>
                    </div>
                </div>

                {/* Right Side: Spline 3D */}
                <div className={styles.splineSection}>
                    <iframe
                        src='https://my.spline.design/boxeshover-1RvvNhAKs5fmVFVoHrGr7by0/'
                        frameBorder='0'
                        width='100%'
                        height='100%'
                        className={styles.splineContainer}
                        title="3D Background"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default JoinEvent;
