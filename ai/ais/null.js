const constants = require('./../../constants');

exports.update = function(modules) {
    // we return to standby
    return {type : constants.standBy};
}

// init
exports.init = function() {
    
}