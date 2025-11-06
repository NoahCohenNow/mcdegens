import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    this.logDir = path.join(__dirname, '../logs');
    
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _getTimestamp() {
    return new Date().toISOString();
  }

  _getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `brotherhood-${date}.log`);
  }

  _writeLog(level, message, data = null) {
    const timestamp = this._getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logString = JSON.stringify(logEntry, null, 2);
    
    // Console output with colors
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[level] || ''}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    // File output
    if (this.logToFile) {
      fs.appendFileSync(this._getLogFileName(), logString + '\n');
    }
  }

  info(message, data) {
    this._writeLog('info', message, data);
  }

  success(message, data) {
    this._writeLog('success', message, data);
  }

  warn(message, data) {
    this._writeLog('warn', message, data);
  }

  error(message, data) {
    this._writeLog('error', message, data);
  }

  transaction(message, txSignature, data) {
    this._writeLog('success', `${message} | TX: https://solscan.io/tx/${txSignature}`, data);
  }
}

export const logger = new Logger();
