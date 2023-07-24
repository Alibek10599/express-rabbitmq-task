import {createLogger, format, transports} from 'winston';

const {combine, timestamp, printf} = format;

const logFormat = printf(({level, message, timestamp}) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({filename: 'combined.log'}),
  ],
});

export default logger;
