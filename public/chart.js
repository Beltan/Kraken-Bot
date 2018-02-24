window.onload = function(){
    var graphHtml = ' <div card class="col-6">' +
        '<canvas id="myChart{id}" width="100" height="100"></canvas>' +
    '</div>';

    var container = document.getElementById("chartsDiv");
    var id = 0;

    function createNewChart(config) {
        // add new canvas
        id++;
        var newHtml = graphHtml.replace("{id}", id);
        container.insertAdjacentHTML('beforeend', newHtml);

        //fill the data chart
        var ctx = document.getElementById("myChart" + id).getContext('2d');
        var myChart = new Chart(ctx, config);
    }


    //connect to the server
    var socket = io();

    socket.on('chartData', function(config){
        createNewChart(config);
    });
}
