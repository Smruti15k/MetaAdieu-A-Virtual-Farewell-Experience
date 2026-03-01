import { useState, useRef, useEffect } from 'react';
import styles from './SupportBot.module.css';
import { API_base_URL } from '../config';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const SupportBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages: Message[] = [
            ...messages,
            { role: 'user', content: userMessage }
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_base_URL}/api/support/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Bot Server API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data?.choices?.[0]?.message) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.choices[0].message.content
                }]);
            } else {
                console.error('Unexpected bot response format:', data);
                throw new Error('Invalid response from bot server');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I am having trouble connecting to my brain right now! Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.botContainer}>
            {isOpen ? (
                <div className={styles.chatWindow}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div className={styles.headerIcon}>
                                <div className={styles.onlineDot}></div>
                            </div>
                            <div className={styles.headerText}>
                                <h3>Support Bot</h3>
                                <span>Online</span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className={styles.messagesContainer}>
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.botWrapper}`}>
                                <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`${styles.messageWrapper} ${styles.botWrapper}`}>
                                <div className={`${styles.message} ${styles.botMessage} ${styles.typing}`}>
                                    <span className={styles.dot}></span>
                                    <span className={styles.dot}></span>
                                    <span className={styles.dot}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className={styles.inputArea} onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </form>
                </div>
            ) : (
                <button className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                    <div className={styles.iconCircle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13401 2 5 5.13401 5 9V11C5 12.1046 5.89543 13 7 13H17C18.1046 13 19 12.1046 19 11V9C19 5.13401 15.866 2 12 2Z" fill="white" />
                            <rect x="8" y="7" width="2" height="2" rx="1" fill="#0066FF" />
                            <rect x="14" y="7" width="2" height="2" rx="1" fill="#0066FF" />
                            <path d="M7 13L10 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className={styles.triggerInfo}>
                        <span className={styles.title}>Support Bot</span>
                        <div className={styles.status}>
                            <span className={styles.statusDot}></span>
                            <span className={styles.statusText}>Online</span>
                        </div>
                    </div>
                </button>
            )}
        </div>
    );
};
