const isDev = process.env.NODE_ENV === "development";
const timers = new Map();

const originalLog = console.log;
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

global.logger = {
    log: (...args) => {
        if (isDev) {
            originalLog("[DEV] ", getTimestamp(), ...args);
        }
    },
    info: (...args) => {
        if (isDev) {
            originalLog("[INFO] ", getTimestamp(), ...args);
        }
    },
    warn: (...args) => {
        if (isDev) {
            originalLog("[WARN] ", getTimestamp(), ...args);
        }
    },
    error: (...args) => {
        originalLog("[ERROR] ", getTimestamp(), ...args);
    },
    time: (label) => {
        if (isDev) {
            timers.set(label, performance.now());
            originalLog("[TIME]  ", getTimestamp(), `${label} started`);
        }
    },
    timeEnd: (label) => {
        if (isDev && timers.has(label)) {
            const duration = performance.now() - timers.get(label);
            timers.delete(label);
            originalLog("[TIME]  ", getTimestamp(), `${label}: ${duration.toFixed(2)}ms`);
        }
    }
}

