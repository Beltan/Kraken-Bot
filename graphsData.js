api = require('./apiWrapper');

var chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(231,233,237)'
};

function getRandomColor() {
    let values = Object.values(chartColors);
    return values[Math.floor(Math.random() * values.length)];
}

exports.getHistoricGraph = function(column) {

    return {
        id : 'historic' + column,
        type: 'line',
        data: {
            labels: Array(api.tradeHistory.length).fill(''),
            datasets: [{
                label: "Historic " + column,
                borderColor: getRandomColor(),
                data: api.tradeHistory.map(a => a[column]),
            }]
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