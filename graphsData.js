api = require('./apiWrapper');

var chartColors = {
    blue: 'rgb(54, 162, 235)',
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    purple: 'rgb(153, 102, 255)'
};

function getColorIndex(i) {
    let values = Object.values(chartColors);
    return values[i % values.length];
}

function getRandomColor() {
    let values = Object.values(chartColors);
    var i = Math.floor(Math.random() * values.length);
    return values[i % values.length];
}

function getOption(key, def, i, options) {
    var option = def;
    if(i < options.length && key in options[i]) 
        option = options[i][key];

    return option;
}

function graphObject(id, datasets, length) {
    return {
        id : id.replace(/\s+/g, ''),
        type: 'line',
        data: {
            labels: Array(length).fill(''),
            datasets: datasets
        },
        options: {
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    },
                    gridLines: {
                        display: false
                    }
                }]
            }
        }
    };
}

exports.getGraph = function(id, data, key = null, options = [], filters = []) {

    if(filters.length == 0) {
        filters.push(a => true);
    }

    var maxLength = 0;

    var datasets = [];
    // we add the data that pass the filters
    for(var i = 0; i < filters.length; i++) {
        var newValues = data.filter(filters[i]);
        if(key != null)
            newValues = newValues.map(a => a[key]);

        //get the color
        var color = getOption("color", getColorIndex(i), i, options);

        //get the label
        var label = getOption("label", id + ":" + i, i, options);

        datasets.push({
            label: label,
            borderColor: color,
            data: newValues
        });

        if(newValues.length > maxLength)
            maxLength = newValues.length;
    }
   
    return graphObject(id, datasets, maxLength);
    
}

var getBasicFilterFunction = function(column, value, negate = false) {
    var filterFunction = function(elem) {
        if(negate) return elem[column] != value;
        return elem[column] == value;
    }

    return filterFunction;
}

exports.getHistoricGraph = function(column, filterColumn = null, filterValue = null) {
    var name = "Historic " + column;

    var filterFunctions = [];
    if(filterColumn != null && filterValue != null) {
        var filterFunction1 = getBasicFilterFunction(filterColumn, filterValue, false);
        var filterFunction2 = getBasicFilterFunction(filterColumn, filterValue, true);
        
        filterFunctions.push(filterFunction1);
        filterFunctions.push(filterFunction2);
    }
  
    return this.getGraph(name, api.tradeHistory, column, [], filterFunctions);
}