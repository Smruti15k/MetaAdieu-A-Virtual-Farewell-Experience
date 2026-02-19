import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { FaHeart, FaVideo, FaGift, FaMagic, FaShieldAlt } from 'react-icons/fa';
import styles from './Home.module.css';

const Home: FC = () => {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 50 }
        }
    };

    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <div className={styles.logo}>MetaAdieu</div>
                <div className={styles.navLinks}>
                    <Link to={localStorage.getItem('token') ? "/create-event" : "/login"} className={styles.link}>Host</Link>
                    <Link to="/join-event" className={styles.link}>Join</Link>
                    {localStorage.getItem('token') ? (
                        <Link to="/dashboard" className={styles.ctaBtn}>Dashboard</Link>
                    ) : (
                        <Link to="/login" className={styles.ctaBtn}>Get Started</Link>
                    )}
                </div>
            </nav>

            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <motion.div
                        className={styles.pill}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        Redefining Goodbyes
                    </motion.div>

                    <motion.h1
                        className={styles.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Farewells Reimagined<br /> for the Digital Age.
                    </motion.h1>

                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                    >
                        Create a lasting tribute with our immersive virtual event platform.
                        Live streaming, digital keepsakes, and collaborative memory walls—all in one place.
                    </motion.p>

                    <motion.div
                        className={styles.heroButtons}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {localStorage.getItem('token') ? (
                            <Link to="/dashboard" className={styles.btnPrimary}>Go to Dashboard</Link>
                        ) : (
                            <Link to="/login" className={styles.btnPrimary}>Host an Event</Link>
                        )}
                        <Link to="/join-event" className={styles.btnSecondary}>Join Event</Link>
                    </motion.div>
                </div>
            </header>

            <motion.section
                className={styles.features}
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                <motion.div className={`${styles.featureCard} ${styles.cardLarge} ${styles.cardGradient1}`} variants={itemVariants}>
                    <div className={styles.featureIcon}><FaHeart style={{ color: '#4A7FA7' }} /></div>
                    <h3>Collaborative Memory Wall</h3>
                    <p>A shared digital canvas where guests can post photos, videos, and heartfelt notes in real-time. Watch the memories pile up.</p>
                </motion.div>

                <motion.div className={`${styles.featureCard} ${styles.cardGradient2}`} variants={itemVariants}>
                    <div className={styles.featureIcon}><FaVideo style={{ color: '#B3CFE5' }} /></div>
                    <h3>Live Broadcast</h3>
                    <p>Seamless high-quality streaming for speeches and toasts.</p>
                </motion.div>

                <motion.div className={`${styles.featureCard} ${styles.cardTall} ${styles.cardGradient3}`} variants={itemVariants}>
                    <div className={styles.featureIcon}><FaGift style={{ color: '#F6FAFD' }} /></div>
                    <h3>Digital Goodie Bag</h3>
                    <p>Automatically generated PDF keepsakes for every guest. Includes a compilation of all messages and photos shared during the event.</p>
                </motion.div>

                <motion.div className={styles.featureCard} variants={itemVariants}>
                    <div className={styles.featureIcon}><FaShieldAlt style={{ color: '#B3CFE5' }} /></div>
                    <h3>Secure & Private</h3>
                    <p>Invite-only access ensures your moments remain intimate.</p>
                </motion.div>

                <motion.div className={styles.featureCard} variants={itemVariants}>
                    <div className={styles.featureIcon}><FaMagic style={{ color: '#F6FAFD' }} /></div>
                    <h3>AI-Powered Tributes</h3>
                    <p>Let our AI suggest touching farewell messages.</p>
                </motion.div>
            </motion.section>
        </div>
    );
};

export default Home;
