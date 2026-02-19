import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import styles from './Auth.module.css';
import { signInWithGoogle, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '../components/Toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleGoogleSignIn = async () => {
        try {
            const user = await signInWithGoogle();
            console.log("Logged in user:", user);
            localStorage.setItem('token', await user.getIdToken());
            localStorage.setItem('user', JSON.stringify({
                id: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            }));
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Google Sign In failed. Please check your console.');
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const { loginWithEmail } = await import('../firebase');
            const user = await loginWithEmail(email, password);
            localStorage.setItem('token', await user.getIdToken());
            localStorage.setItem('user', JSON.stringify({
                id: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL || 'https://via.placeholder.com/150'
            }));
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login failed');
        }
    };

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
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Left Side: Brand */}
                <motion.div
                    className={styles.brandSection}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className={styles.brandLogo}>MetaAdieu</h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        style={{ fontSize: '1.2rem', marginTop: '1rem', fontStyle: 'italic', letterSpacing: '1px' }}
                    >
                        Where Every User Feels Valued
                    </motion.p>
                </motion.div>

                {/* Right Side: Auth Card */}
                <div className={styles.cardSection}>
                    <motion.div
                        className={styles.authCard}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div className={styles.cardHeader} variants={itemVariants}>
                            <h2>Log In</h2>
                            <div className={styles.toggle}>
                                <span>Log In / <Link to="/register">Sign Up</Link></span>
                            </div>
                        </motion.div>

                        {error && <motion.div className={styles.error} variants={itemVariants}>{error}</motion.div>}

                        <form onSubmit={handleEmailLogin}>
                            <motion.div className={styles.inputGroup} variants={itemVariants}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </motion.div>
                            <motion.div className={styles.inputGroup} variants={itemVariants}>
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </motion.div>

                            <motion.span
                                className={styles.forgotPassword}
                                variants={itemVariants}
                                onClick={() => setShowForgotPassword(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                Forgot Password?
                            </motion.span>

                            <motion.button
                                type="submit"
                                className={styles.submitBtn}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Log In
                            </motion.button>
                        </form>

                        <motion.div className={styles.divider} variants={itemVariants}>
                            <span>OR</span>
                        </motion.div>

                        <motion.div className={styles.socialButtons} variants={itemVariants}>
                            <motion.div
                                className={styles.socialBtn}
                                whileHover={{ y: -3 }}
                                onClick={handleGoogleSignIn}
                            >
                                <FaGoogle />
                                <span style={{ marginLeft: '10px', fontSize: '1rem', fontWeight: 500 }}>Sign in with Google</span>
                            </motion.div>
                        </motion.div>

                        <motion.div className={styles.footer} variants={itemVariants}>
                            Don't have an account? <Link to="/register">Sign up</Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Forgot Password Modal */}
                <AnimatePresence>
                    {showForgotPassword && (
                        <motion.div
                            className={styles.modalOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForgotPassword(false)}
                        >
                            <motion.div
                                className={styles.modalCard}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Reset Password</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                                    Enter your email and we'll send you a reset link.
                                </p>
                                <form onSubmit={handleForgotPassword}>
                                    <div className={styles.inputGroup}>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        disabled={resetLoading}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                                <p
                                    style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '1rem', cursor: 'pointer', textAlign: 'center' }}
                                    onClick={() => setShowForgotPassword(false)}
                                >
                                    ← Back to Login
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
