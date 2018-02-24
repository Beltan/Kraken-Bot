window.onload = function(){

    var graphs = {};

    var graphHtml = ' <div card class="col-6">' +
        '<canvas id="myChart{id}" width="100" height="100"></canvas>' +
    '</div>';

    var container = document.getElementById("chartsDiv");

    function createNewChart(config) {
        // add new canvas
        var id = config.id;
        var newHtml = graphHtml.replace("{id}", id);
        container.insertAdjacentHTML('beforeend', newHtml);

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
}
