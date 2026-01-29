import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function MarqueeText({ text, speed = 50 }) {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            setDistance(containerWidth); // total distance to scroll
        }
    }, [text]);

    return (
        <div ref={containerRef} className="overflow-hidden whitespace-nowrap">
            <motion.div
                ref={textRef}
                className="inline-block"
                animate={{ x: [distance, -distance] }}
                transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                    duration: distance / speed, // speed px per second
                }}
            >
                {text}
            </motion.div>
        </div>
    );
}
