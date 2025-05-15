import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { NODE_ENV } from '../config';

// Use the existing bin directory for logs
const baseLogDirectory = path.join(process.cwd(), 'bin');

// Create subdirectories for different log types
const errorLogDirectory = path.join(baseLogDirectory, 'error');
const infoLogDirectory = path.join(baseLogDirectory, 'info');
const combinedLogDirectory = path.join(baseLogDirectory, 'combined');

// Ensure all log directories exist
[baseLogDirectory, errorLogDirectory, infoLogDirectory, combinedLogDirectory].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Custom format for console output with colors and symbols
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;

    // Format the message - simple and clean
    const formattedMessage = `${timestamp} ${level}: ${message}`;

    // Add any additional metadata
    return Object.keys(rest).length
      ? `${formattedMessage}\n${JSON.stringify(rest, null, 2)}`
      : formattedMessage;
  })
);

// Format for file logs (without colors)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    const formattedMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    return Object.keys(rest).length
      ? `${formattedMessage}\n${JSON.stringify(rest, null, 2)}`
      : formattedMessage;
  })
);

// Set log level based on environment
const logLevel = NODE_ENV === 'production' ? 'info' : 'debug';

// Create daily rotate file transports with 24-hour retention
const errorRotateFile = new transports.DailyRotateFile({
  filename: path.join(errorLogDirectory, 'error.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '1d', // Keep logs for 1 day
  format: fileFormat,
  auditFile: path.join(errorLogDirectory, '.error-audit.json')
});

const infoRotateFile = new transports.DailyRotateFile({
  filename: path.join(infoLogDirectory, 'info.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxFiles: '1d', // Keep logs for 1 day
  format: fileFormat,
  auditFile: path.join(infoLogDirectory, '.info-audit.json')
});

const combinedRotateFile = new transports.DailyRotateFile({
  filename: path.join(combinedLogDirectory, 'combined.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '1d', // Keep logs for 1 day
  format: fileFormat,
  auditFile: path.join(combinedLogDirectory, '.combined-audit.json')
});

// Setup log rotation events - using a simple console log that won't show in normal output
[errorRotateFile, infoRotateFile, combinedRotateFile].forEach(transport => {
  transport.on('rotate', (_oldFilename, _newFilename) => {
    // Silent rotation - no need to log this
  });
});

export const logger = createLogger({
  level: logLevel,
  transports: [
    // Console transport with custom format
    new transports.Console({
      format: consoleFormat
    }),
    // Rotating file transports
    errorRotateFile,
    infoRotateFile,
    combinedRotateFile
  ],
  // Don't exit on error
  exitOnError: false
});
