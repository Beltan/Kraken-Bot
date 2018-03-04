// Need to check if all cases are accounted for

/*

get data from kraken all at once
update parameters like localMin

// different scenarios:

if no order placed and buy conditions -> place buy order
if no order placed and no buy conditions -> stand by
if buy order placed and buy conditions -> update buy order
if buy order placed and no buy conditions -> cancel buy order
if buy order filled -> place sell order
if sell order placed and buy conditions and multiple buys enabled -> place buy order
if sell order placed and no buy conditions -> standby
if sell order filled and no buy conditions -> standby
if sell order filled and buy conditions -> place buy order
if buy order pending and buy conditions -> standby
if buy order pending and no buy conditions -> cancel buy order
if sell order partial filled -> standby
if buy order partial filled and buy conditions -> update buy order if the remaining volume is higher than the minimum required, otherwise stand by
if buy order partial filled and no buy conditions -> cancel buy order and place sell order*

* if the balance is really low, the bot might get stuck without enough funds to buy/sell

*/