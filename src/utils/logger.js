import { isElectronProduction } from './envUtils';

/**
 * log level
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * logger
 */
class Logger {
  constructor() {
    this.isProduction = isElectronProduction();
    this.logLevel = this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;
  }

  /**
   * format error message
   * @param {string} context - error context
   * @param {Error|string} error - error object or error message
   * @param {Object} additionalData - additional data
   * @returns {string} formatted error message
   */
  formatError(context, error, additionalData = {}) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : '';
    
    let formattedMessage = `[${timestamp}] [${context}] ${errorMessage}`;
    
    if (Object.keys(additionalData).length > 0) {
      formattedMessage += ` | Data: ${JSON.stringify(additionalData)}`;
    }
    
    if (stackTrace && !this.isProduction) {
      formattedMessage += `\nStack: ${stackTrace}`;
    }
    
    return formattedMessage;
  }

  /**
   * log debug message
   * @param {string} context - context
   * @param {string} message - message
   * @param {Object} data - data
   */
  debug(context, message, data = {}) {
    if (this.logLevel <= LogLevel.DEBUG) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] [${context}] ${message}`, data);
    }
  }

  /**
   * log info message
   * @param {string} context - context
   * @param {string} message - message
   * @param {Object} data - data
   */
  info(context, message, data = {}) {
    if (this.logLevel <= LogLevel.INFO) {
      const timestamp = new Date().toISOString();
      console.info(`[${timestamp}] [INFO] [${context}] ${message}`, data);
    }
  }

  /**
   * log warn message
   * @param {string} context - context
   * @param {string} message - message
   * @param {Object} data - data
   */
  warn(context, message, data = {}) {
    if (this.logLevel <= LogLevel.WARN) {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [WARN] [${context}] ${message}`, data);
    }
  }

  /**
   * log error message
   * @param {string} context - context
   * @param {Error|string} error - error object or error message
   * @param {Object} additionalData - additional data
   */
  error(context, error, additionalData = {}) {
    if (this.logLevel <= LogLevel.ERROR) {
      const formattedError = this.formatError(context, error, additionalData);
      console.error(formattedError);
      
    // in production, can send error to server or save to file
      if (this.isProduction) {
        this.logToFile(formattedError);
      }
    }
  }

  /**
   * log fatal error
   * @param {string} context - context
   * @param {Error|string} error - error object or error message
   * @param {Object} additionalData - additional data
   */
  fatal(context, error, additionalData = {}) {
    if (this.logLevel <= LogLevel.FATAL) {
      const formattedError = this.formatError(context, error, additionalData);
      console.error(`[FATAL] ${formattedError}`);
      
      // in production, can send error to server or save to file
      if (this.isProduction) {
        this.logToFile(`[FATAL] ${formattedError}`);
      }
    }
  }

  /**
   * log XML parsing error
   * @param {string} context - context
   * @param {string} xmlPath - XML file path
   * @param {Error} error - error object
   * @param {Object} additionalData - additional data
   */
  xmlError(context, xmlPath, error, additionalData = {}) {
    const data = {
      xmlPath,
      ...additionalData
    };
    this.error(context, error, data);
  }

  /**
   * log file reading error
   * @param {string} context - context
   * @param {string} filePath - file path
   * @param {Error} error - error object
   * @param {Object} additionalData - additional data
   */
  fileError(context, filePath, error, additionalData = {}) {
    const data = {
      filePath,
      ...additionalData
    };
    this.error(context, error, data);
  }

  /**
   * log limb building error
   * @param {string} context - context
   * @param {string} limbId - limb ID
   * @param {Error} error - error object
   * @param {Object} additionalData - additional data
   */
  limbError(context, limbId, error, additionalData = {}) {
    const data = {
      limbId,
      ...additionalData
    };
    this.error(context, error, data);
  }

  /**
   * log to file (production environment)
   * @param {string} message - log message
   */
  logToFile(message) {
    // in production, can implement file logging or send to remote logging service
    if (window.electronAPI && window.electronAPI.logError) {
      try {
        window.electronAPI.logError(message);
      } catch (e) {
        // 如果electron API不可用，回退到console
        console.error('Failed to log to file:', e);
        console.error('Original error:', message);
      }
    }
  }
}

// create global logger instance
export const logger = new Logger();

// export convenient methods
export const logDebug = (context, message, data) => logger.debug(context, message, data);
export const logInfo = (context, message, data) => logger.info(context, message, data);
export const logWarn = (context, message, data) => logger.warn(context, message, data);
export const logError = (context, error, data) => logger.error(context, error, data);
export const logFatal = (context, error, data) => logger.fatal(context, error, data);
export const logXmlError = (context, xmlPath, error, data) => logger.xmlError(context, xmlPath, error, data);
export const logFileError = (context, filePath, error, data) => logger.fileError(context, filePath, error, data);
export const logLimbError = (context, limbId, error, data) => logger.limbError(context, limbId, error, data); 