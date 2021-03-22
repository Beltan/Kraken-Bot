const config = require('./../config').ai;
const logger = require('./../logger').logger();

let modules = {};

for(let i in config.modules) {
    let aimodule = config.modules[i];
    if(typeof aimodule == "string") {
        aimodule = {
            name: aimodule,
            config: {}
        }
    }

    let file = aimodule.name;

    let mod = require("./modules/" + file);
    mod.name = file;

    // check that module dependencies are present and executed before
    for(let j in mod.dependencies) {
        let dependency = mod.dependencies[j];
        if(!modules.hasOwnProperty(dependency)) {
           logger.error("Dependency " + dependency + " of module " + file + 
                " is not present. Check correct order of dependencies.");
            process.exit(1);
        }
    }

    modules[aimodule.name] = {
        mod: mod,
        name: aimodule.name,
        conf: aimodule.config
    }
};

// ai name is mandatory
let ai = require("./ais/" + config.aiName);
let aiConfig = config.aiConfig ? config.aiConfig : {};

// if there is a manager, load it
let manager = null;
if(config.managerName) {
    manager = require("./managers/" + config.managerName);
}
let managerConfig = config.aiConfig ? config.aiConfig : {};

let call = function(obj, method, config = {}, params = null, values = null,) {
    if(method in obj) {
        return obj[method](config, params, values);
    }
    else {
        logger.error("Error calling method: " + method);
        logger.error("Method doesn't exists");
        process.exit(1);
    }
}

let callInOrder = function(method, values = null) {

    let params = {};

    // for all the needed modules
    Object.keys(modules).forEach(function(moduleName) {
        let currentModule = modules[moduleName];
        params[moduleName] = call(currentModule.mod, method, currentModule.conf, params, values);
    });

    let decision = call(ai, method, values, params, aiConfig);
    params.decision = decision;
    if(manager != null) decision = call(manager, method, managerConfig.conf, params);
    
    return decision;
}

exports.decide = function(values) {
    return callInOrder("update", values);
}

// init all modules
exports.init = function() {
    callInOrder("init");
}

exports.continue = function() {
    // by the moment, the ai always says to continue
    return true;
}