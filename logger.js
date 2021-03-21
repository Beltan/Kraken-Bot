const {createLogger, format, transports, config} = require('winston');
const user_config = require('./config');

let logger;

exports.init = function() {
    logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format(info => {
                    info.level = info.level.toUpperCase()
                    return info;
                })(),
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.colorize(),
                format.splat(),
                format.printf(info => `[${info.level} - ${info.timestamp}] ${info.message}`)
            ),
            level: user_config.logger.level
        }),
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/combined.log', level: user_config.logger.level})
    ]
    });
}

exports.logger = function() {
    return logger;
};

exports.logAllLevels = function logAllLevels() {
    Object.keys(config.npm.levels).forEach(level => {
        logger[level](`is logged`);
    });
}