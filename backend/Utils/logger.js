const isDev = process.env.NODE_ENV === "development";

const originalLog = console.log;



global.logger = {
    log: (...args) => {
        if (isDev) {
            originalLog("[DEV] ", ...args);
        }
    },
    info: (...args) => {
        if (isDev) {
            originalLog("[INFO] ", ...args);
        }
    },
    warn: (...args) => {
        if (isDev) {
            originalLog("[WARN] ", ...args);
        }
    },
    error: (...args) => {
        originalLog("[ERROR] ", ...args);
    }
}

