var config = require('./../config').ia;

var modules = {};

for(var i in config.modulesUsed) {
    var file = config.modulesUsed[i];

    var mod = require("./modules/" + file);
    mod.name = file;

    // check that module dependencies are present and executed before
    for(var j in mod.dependencies) {
        var dependency = mod.dependencies[j];
        if(!modules.hasOwnProperty(dependency)) {
            console.log("Dependency " + dependency + " of module " + file + 
                " is not present. Check correct order of dependencies.");
            process.exit(1);
        }
    }

    modules[file] = mod;
};

// ai name is mandatory 
var ai = require("./ais/" + config.aiName);

// if there is a manager, load it
var manager = null;
if(config.hasOwnProperty("managerName") && config.managerName != "") {
    manager = require("./managers/" + config.managerName);
}

var call = function(obj, method, values, params = null) {
    if(method in obj) {
        return obj[method](values, params);
    }
    else {
        console.log("Error calling method: " + method);
        console.log("Method doesn't exists");
        process.exit(1);
    }
}

var callInOrder = function(method, values = null) {

    var params = {};
    // for all the needed modules
    Object.keys(modules).forEach(function(moduleName) {
        var currentModule = modules[moduleName];
        params[moduleName] = call(currentModule, method, values, params);
    });

    var decision = call(ai, method, values, params);
    params.decision = decision;
    if(manager != null) decision = call(manager, method, values, params);
    
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