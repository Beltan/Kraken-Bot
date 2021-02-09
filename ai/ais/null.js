const constants = require('../../constants');

exports.update = function(values, modules) {
    // we return to standby
    console.log(values);
    return {type : constants.standBy};
}

// init
exports.init = function() {
    
}