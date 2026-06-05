import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, json, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      stack
    });
  }
  return JSON.stringify({
    timestamp,
    level,
    message
  });
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: 'cart-service'
  },
  transports: [
    new transports.Console()
  ]
});
