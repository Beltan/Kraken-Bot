api = require('./apiWrapper');

var chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)'
};

function getColorIndex(i) {
    let values = Object.values(chartColors);
    return values[i % chartColors.length];
}

function getRandomColor() {
    let values = Object.values(chartColors);
    var i = Math.floor(Math.random() * chartColors.length);
    return getColorIndex(i);
}

function getOption(key, def, i, options) {
    var option = def;
    if(i < options.length && key in options[i]) 
        option = options[i][key];

    return option;
}

exports.getGraph = function(id, data, key = null, options = [], filters = []) {

    var maxLength = 0;

    var datasets = [];
    if(filters.length > 0) {
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
    }
    else {
        // if we have a key then we need to convert the data
        if(key != null)
            data = data.map(a => a[key]);

        maxLength = data.length;

        //get label
        var label = getOption("label", id, 0, options);

        datasets.push({
            label: label,
            borderColor: getRandomColor(),
            data: data,
        });
    }


    return {
        id : id.replace(/\s+/g, ''),
        type: 'line',
        data: {
            labels: Array(maxLength).fill(''),
            datasets: datasets
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    };
    
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