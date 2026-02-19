import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NotFound.module.css';

const NotFound = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <motion.div
                    className={styles.ghostWrap}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className={styles.ghost}>👻</span>
                </motion.div>

                <motion.h1
                    className={styles.code}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    404
                </motion.h1>

                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    This page has said its farewell
                </motion.h2>

                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Looks like this page doesn't exist or has moved on to better places.
                </motion.p>

                <motion.div
                    className={styles.actions}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link to="/" className={styles.btnPrimary}>Go Home</Link>
                    <Link to="/join-event" className={styles.btnSecondary}>Join Event</Link>
                </motion.div>
            </div>

            {/* Decorative particles */}
            <div className={styles.particles}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={styles.particle} />
                ))}
            </div>
        </div>
    );
};

export default NotFound;
