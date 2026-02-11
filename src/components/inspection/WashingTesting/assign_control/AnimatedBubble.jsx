import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AnimatedBubble.css';

const AnimatedBubble = ({
    role,
    user,
    isActive,
    onClick,
    isOptimistic = false
}) => {
    const [isPopping, setIsPopping] = useState(false);
    const [particles, setParticles] = useState([]);

    // Bubble colors based on role - vibrant game-like colors
    const bubbleColors = {
        prepared: {
            primary: '#FF6B6B',
            secondary: '#FF8E53',
            glow: 'rgba(255, 107, 107, 0.6)'
        },
        checked: {
            primary: '#4ECDC4',
            secondary: '#44A08D',
            glow: 'rgba(78, 205, 196, 0.6)'
        },
        approved: {
            primary: '#45B7D1',
            secondary: '#5F27CD',
            glow: 'rgba(69, 183, 209, 0.6)'
        }
    };

    const colors = bubbleColors[role];

    const handleClick = () => {
        if (!isOptimistic) {
            setIsPopping(true);

            // Create particle explosion
            const newParticles = Array.from({ length: 12 }, (_, i) => ({
                id: Date.now() + i,
                angle: (i * 30) * (Math.PI / 180),
                distance: 60 + Math.random() * 40
            }));
            setParticles(newParticles);

            setTimeout(() => {
                setIsPopping(false);
                setParticles([]);
            }, 600);
        }
        onClick?.();
    };

    // Random floating offset for natural movement
    const [floatOffset] = useState({
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        duration: 2 + Math.random() * 2
    });

    return (
        <motion.div
            className={`bubble-container ${isOptimistic ? 'optimistic' : ''}`}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{
                scale: isActive ? [1, 1.05, 1] : 0.85,
                opacity: isOptimistic ? 0.7 : 1,
                y: isActive ? [floatOffset.y, floatOffset.y - 15, floatOffset.y] : floatOffset.y,
                x: isActive ? [floatOffset.x, floatOffset.x + 10, floatOffset.x] : 0,
                rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            exit={{ scale: 0, opacity: 0, y: -100 }}
            transition={{
                scale: {
                    repeat: isActive ? Infinity : 0,
                    duration: 2,
                    ease: 'easeInOut'
                },
                y: {
                    repeat: isActive ? Infinity : 0,
                    duration: floatOffset.duration,
                    ease: 'easeInOut'
                },
                x: {
                    repeat: isActive ? Infinity : 0,
                    duration: floatOffset.duration + 0.5,
                    ease: 'easeInOut'
                },
                rotate: {
                    repeat: isActive ? Infinity : 0,
                    duration: 3,
                    ease: 'easeInOut'
                }
            }}
            whileHover={{
                scale: 1.15,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
        >
            <motion.div
                className="bubble"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: isActive
                        ? `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.3)`
                        : `0 8px 32px rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.2)`
                }}
                animate={{
                    scale: isPopping ? [1, 1.3, 0] : 1,
                    rotate: isPopping ? [0, 180] : 0
                }}
                transition={{
                    duration: 0.4
                }}
            >
                {/* Multiple shine layers for depth */}
                <div className="bubble-shine bubble-shine-1" />
                <div className="bubble-shine bubble-shine-2" />
                <div className="bubble-shine bubble-shine-3" />

                {/* Animated ring pulse */}
                {isActive && (
                    <motion.div
                        className="bubble-ring"
                        style={{
                            borderColor: colors.primary
                        }}
                        animate={{
                            scale: [1, 1.5],
                            opacity: [0.6, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                )}

                {/* User info */}
                <motion.div
                    className="bubble-content"
                    animate={{
                        y: isActive ? [0, -3, 0] : 0
                    }}
                    transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        ease: 'easeInOut'
                    }}
                >
                    <div className="role-label">{role.toUpperCase()}</div>
                    <div className="user-name">{user || 'Unassigned'}</div>
                </motion.div>

                {/* Floating particles around bubble */}
                <AnimatePresence>
                    {isActive && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    className="bubble-particle"
                                    style={{
                                        background: colors.primary
                                    }}
                                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1, 0.5, 0],
                                        x: Math.cos((i * Math.PI * 2) / 8) * 50,
                                        y: Math.sin((i * Math.PI * 2) / 8) * 50,
                                        opacity: [0, 1, 0.5, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: 'easeOut'
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Pop explosion particles */}
                <AnimatePresence>
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="explosion-particle"
                            style={{
                                background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`
                            }}
                            initial={{
                                scale: 1,
                                x: 0,
                                y: 0,
                                opacity: 1
                            }}
                            animate={{
                                scale: [1, 0],
                                x: Math.cos(particle.angle) * particle.distance,
                                y: Math.sin(particle.angle) * particle.distance,
                                opacity: [1, 0]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: 'easeOut'
                            }}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Optimistic loading indicator */}
            {isOptimistic && (
                <motion.div
                    className="optimistic-spinner"
                    style={{
                        borderTopColor: colors.primary
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Glow effect underneath */}
            {isActive && (
                <motion.div
                    className="bubble-glow"
                    style={{
                        background: `radial-gradient(circle, ${colors.glow}, transparent)`
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            )}
        </motion.div>
    );
};

export default AnimatedBubble;
