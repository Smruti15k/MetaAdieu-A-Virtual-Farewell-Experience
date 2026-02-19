import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.brand}>
                    <h3 className={styles.logo}>MetaAdieu</h3>
                    <p className={styles.tagline}>Farewells reimagined for the digital age.</p>
                </div>

                <div className={styles.links}>
                    <div className={styles.linkGroup}>
                        <h4>Platform</h4>
                        <Link to="/">Home</Link>
                        <Link to="/create-event">Host Event</Link>
                        <Link to="/join-event">Join Event</Link>
                    </div>
                    <div className={styles.linkGroup}>
                        <h4>Account</h4>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Sign Up</Link>
                        <Link to="/dashboard">Dashboard</Link>
                    </div>
                </div>

                <div className={styles.social}>
                    <a href="https://github.com/Smruti15k" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                    </a>
                    <a href="mailto:contact@metaadieu.com" aria-label="Email">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 7L2 7" /></svg>
                    </a>
                </div>
            </div>

            <div className={styles.bottom}>
                <p>© {new Date().getFullYear()} MetaAdieu. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
