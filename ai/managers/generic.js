const constants = require('../../constants');

exports.dependencies = [];

exports.update = function(params) {

    // we can get the decision
    let decision = params.decision;

    // and we need to transalte it to an instruction list
    let instructions = [];
    
    if (decision.type !== constants.standBy) {

    }

    return instructions;
}

exports.init = function(params) {
}