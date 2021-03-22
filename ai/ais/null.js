const constants = require('./../../constants');

exports.update = function(config, state, store) {
    // we return to standby
    return {type : constants.standBy};
}

// init
exports.init = function() {
    
}