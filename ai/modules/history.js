exports.dependencies = [];

let data;

exports.update = function(params) {
    data.push(params);
    return data;
}
exports.init = function() {
    data = [];
}