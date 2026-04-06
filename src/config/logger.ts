import winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Format สำหรับ dev
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}`;
        }
        return `${timestamp} ${level}: ${message} ${metaStr}`;
    })
);

// Format สำหรับ production -- JSON เพื่อให้ parse ง่าย
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'banking-api' },
    transports: [
        // Console -- ใช้ทั้ง dev และ production
        new winston.transports.Console(),

        // File transports -- production only
        ...(isProduction
            ? [
                  // error.log -- เก็บแค่ error
                  new winston.transports.File({
                      filename: 'logs/error.log',
                      level: 'error',
                      maxsize: 10 * 1024 * 1024, // 10MB
                      maxFiles: 5,
                  }),
                  // combined.log -- เก็บทุก level
                  new winston.transports.File({
                      filename: 'logs/combined.log',
                      maxsize: 10 * 1024 * 1024,
                      maxFiles: 10,
                  }),
              ]
            : []),
    ],
});