
const LOG_LEVELS = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
};

const formatMessage = (level, message, meta = {}) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    }, null, 2);
};

const logger = {
    info: (message, meta) => console.log(formatMessage(LOG_LEVELS.INFO, message, meta)),
    warn: (message, meta) => console.warn(formatMessage(LOG_LEVELS.WARN, message, meta)),
    error: (message, meta) => console.error(formatMessage(LOG_LEVELS.ERROR, message, meta)),
    debug: (message, meta) => {
        if (process.env.NODE_ENV === "development") {
            console.debug(formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    },
};

export default logger;
