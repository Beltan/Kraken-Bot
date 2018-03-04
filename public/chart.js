window.onload = function(){

    var graphs = {};

    var graphHtml = ' <div card class="col-6">' +
        '<canvas id="myChart{id}" width="100" height="100"></canvas>' +
    '</div>';

    var dataHtml = '<div card class="col-6">' +
        '{name} : {value}' +
    '</div>';

    var chartsContainer = document.getElementById("chartsDiv");
    var infoContainer = document.getElementById("stateInfo");

    function createNewChart(config) {
        // add new canvas
        var id = config.id;
        var newHtml = graphHtml.replace("{id}", id);
        chartsContainer.insertAdjacentHTML('beforeend', newHtml);

        //fill the data chart
        var ctx = document.getElementById("myChart" + id).getContext('2d');
        var myChart = new Chart(ctx, config);

        graphs[id] = myChart;
    }


    //connect to the server
    var socket = io();

    socket.on('chartData', function(config){
        console.log(config);
        if(config.id in graphs) {
            graphs[config.id].update(config);
        }
        else {
            createNewChart(config);
        }
    });

    socket.on('stateData', function(data){
        console.log(data);
        var newHtml = "";
        for (var k in data){
            if (typeof data[k] !== 'function') {
                var html = dataHtml.replace("{name}", k);
                newHtml += html.replace("{value}", JSON.stringify(data[k]));
            }
        }
        infoContainer.innerHTML = newHtml;
    });
}
