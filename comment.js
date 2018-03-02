// Need to check if all cases are accounted for

/*

get data from kraken all at once
update parameters like localMin

// different scenarios:

if no order placed and buy conditions -> place buy order
if no order placed and no buy conditions -> stand by
if buy order placed and buy conditions -> standby / update buy order
if buy order placed and no buy conditions -> cancel buy order
if buy order filled and no buy conditions -> place sell order
if buy order filled and buy conditions and more than one buy is enabled -> place buy and sell orders
if sell order filled and no buy conditions -> standby
if sell order filled and buy conditions -> place buy order
if buy order pending and buy conditions -> standby
if buy order pending and no buy conditions -> cancel buy order

//what happens if partial fill on a buy order??
if sell order partial filled -> standby
if buy order partial filled and buy conditions -> standby / update buy order if enough funds
if buy order partial filled and no buy conditions -> cancel buy order and place sell order

*/