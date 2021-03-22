const constants = require('../../constants');

exports.dependencies = [];

exports.update = function(config, state, store) {

    // we can get the decision
    let decision = state.decision;

    // and we need to transalte it to an instruction list
    let instructions = [];
    
    if (decision.type !== constants.standBy) {

    }

    return instructions;
}

exports.init = function(params) {
}