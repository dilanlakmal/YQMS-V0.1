const isDev = import.meta.env.NODE_ENV === "development";
const timers = new Map();

const getTimestamp = () => {
    const date = new Date();
    return (
        date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0") + " " +
        String(date.getHours()).padStart(2, "0") + ":" +
        String(date.getMinutes()).padStart(2, "0") + ":" +
        String(date.getSeconds()).padStart(2, "0")
    );
};

const logger = {
    log: (...args) => {
        if (isDev) {
            console.log("[DEV]", getTimestamp(), ...args);
        }
    },
    info: (...args) => {
        if (isDev) {
            console.info("[INFO]", getTimestamp(), ...args);
        }
    },
    warn: (...args) => {
        if (isDev) {
            console.warn("[WARN]", getTimestamp(), ...args);
        }
    },
    error: (...args) => {
        // Errors should usually be visible even in prod, but following user request "show only dev environment"
        if (isDev) {
            console.error("[ERROR]", getTimestamp(), ...args);
        }
    },
    time: (label) => {
        if (isDev) {
            timers.set(label, performance.now());
            console.log("[TIME] ", getTimestamp(), `${label} started`);
        }
    },
    timeEnd: (label) => {
        if (isDev && timers.has(label)) {
            const duration = performance.now() - timers.get(label);
            timers.delete(label);
            console.log("[TIME] ", getTimestamp(), `${label}: ${duration.toFixed(2)}ms`);
        }
    }
};

// Make it globally available
window.logger = logger;

export default logger;
