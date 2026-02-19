import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import styles from './Auth.module.css';
import { signInWithGoogle } from '../firebase';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSignUp = async () => {
        try {
            const user = await signInWithGoogle();
            console.log("Registered/Logged in user:", user);
            localStorage.setItem('token', await user.getIdToken());
            localStorage.setItem('user', JSON.stringify({
                id: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            }));
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Google Sign Up failed. Please check your console.');
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const { registerWithEmail } = await import('../firebase');
            const user = await registerWithEmail(email, password, name);
            localStorage.setItem('token', await user.getIdToken());
            localStorage.setItem('user', JSON.stringify({
                id: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL || 'https://via.placeholder.com/150'
            }));
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Registration failed');
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
                        Join the celebration of memories
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
                            <h2>Sign Up</h2>
                            <div className={styles.toggle}>
                                <span><Link to="/login">Log In</Link> / Sign Up</span>
                            </div>
                        </motion.div>

                        {error && <motion.div className={styles.error} variants={itemVariants}>{error}</motion.div>}

                        <form onSubmit={handleEmailSignUp}>
                            <motion.div className={styles.inputGroup} variants={itemVariants}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                />
                            </motion.div>
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
                                    placeholder="Create a password"
                                    required
                                />
                            </motion.div>

                            <motion.button
                                type="submit"
                                className={styles.submitBtn}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Sign Up
                            </motion.button>
                        </form>

                        <motion.div className={styles.divider} variants={itemVariants}>
                            <span>OR</span>
                        </motion.div>

                        <motion.div className={styles.socialButtons} variants={itemVariants}>
                            <motion.div
                                className={styles.socialBtn}
                                whileHover={{ y: -3 }}
                                onClick={handleGoogleSignUp}
                            >
                                <FaGoogle />
                                <span style={{ marginLeft: '10px', fontSize: '1rem', fontWeight: 500 }}>Sign up with Google</span>
                            </motion.div>
                        </motion.div>

                        <motion.div className={styles.footer} variants={itemVariants}>
                            Already have an account? <Link to="/login">Log in</Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;
