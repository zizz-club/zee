// logger.js
import chalk from 'chalk';

function getTimestamp() {
  // Returns a formatted timestamp for log entries
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function getCallerFile() {
  // Uses the error stack to determine the calling file for log context
  const err = new Error();
  const stack = err.stack?.split('\n');
  if (!stack || stack.length < 4) return '';
  for (let i = 3; i < stack.length; i++) {
    const match = stack[i].match(/\((.*?):\d+:\d+\)/) || stack[i].match(/at (.*?):\d+:\d+/);
    if (match && match[1] && !match[1].endsWith('logger.js')) {
      return match[1].split(/[\\/]/).pop();
    }
  }
  return '';
}

function formatPrefix(level) {
  // Formats the log prefix with timestamp, level, and file
  const file = getCallerFile();
  return `[${getTimestamp()}][${level}]${file ? `[${file}]` : ''}`;
}

export const logger = {
  debug: (...args) => {
    // Debug logs (only if DEBUG_MODE is true)
    if (globalThis.DEBUG_MODE && args.length && !args.some(arg => arg === undefined || arg === null)) {
      console.debug(chalk.green(formatPrefix('DEBUG')), ...args);
    }
  },
  info: (...args) => {
    // Info logs
    if (args.length && !args.some(arg => arg === undefined || arg === null)) {
      console.info(chalk.cyan(formatPrefix('INFO')), ...args);
    }
  },
  warn: (...args) => {
    // Warning logs
    if (args.length && !args.some(arg => arg === undefined || arg === null)) {
      console.warn(chalk.yellow(formatPrefix('WARN')), ...args);
    }
  },
  error: (...args) => {
    // Error logs
    if (args.length && !args.some(arg => arg === undefined || arg === null)) {
      console.error(chalk.red(formatPrefix('ERROR')), ...args);
    }
  },
};
