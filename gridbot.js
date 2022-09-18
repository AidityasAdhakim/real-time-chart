const url = 'wss://stream.data.alpaca.markets/v1beta2/crypto';
const socket = new WebSocket(url);

const API_KEY = "PKWMMT1E5P8DKNZ6AOP3";
const API_SECURITY = "ZS5FgrjS0KOV7QlYeKmi8yhA7ImGHVi32nrNQwpF";
const auth = {"action":"auth","key":API_KEY,"secret":API_SECURITY};
const subscribe = {"action":"subscribe","trades":["ETH/USD"],"quotes":["ETH/USD"],"bars":["ETH/USD"]};

const tradesElement = document.getElementById('trades');
const quotesElement = document.getElementById('quotes');

let currentBar = {};
let trades = [];

var start = new Date(Date.now() - (7200*1000)).toISOString();
var bars_url = 'https://data.alpaca.markets/v1beta1/crypto/ETHUSD/bars?exchanges=CBSE&timeframe=1Min&start=' + start;

fetch(bars_url, {
    headers: {
        'APCA-API-KEY-ID': API_KEY,
        'APCA-API-SECRET-KEY': API_SECURITY
    }
}).then((r) => r.json())
.then((response)=>{
    console.log(response);

    const data = response.bars.map(bar => (
        {
            open: bar.o,
            close: bar.c,
            high: bar.h,
            low: bar.l,
            time: Date.parse(bar.t) / 1000
        }
    ));

    currentBar = data[data.length-1];

    console.log(data);

    candleSeries.setData(data);
    })  

var chart = LightweightCharts.createChart(document.getElementById('chart'), {
	width: 600,
    height: 500,
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
});

var candleSeries = chart.addCandlestickSeries();


socket.onmessage = function(event){
    const data = JSON.parse(event.data);
    // console.log(data)

    if(data[0]['msg'] == "connected"){
        console.log('do authentication');

        socket.send(JSON.stringify(auth));
    }

    if(data[0]['msg'] == "authenticated"){
        console.log("Logged In")
        socket.send(JSON.stringify(subscribe));
    }

    for(var key in data){
        const type = data[key].T;

        if(type == 'q'){
            const quoteElement = document.createElement('div');
            quoteElement.className = 'quote';
            var elements = document.getElementsByClassName('quote');
            quoteElement.innerHTML = `<b> ${data[key].t} <b> ${data[key].bp} ${data[key].ap}`;
            quotesElement.appendChild(quoteElement);

            if(elements.length > 10){
                quotesElement.removeChild(elements[0]);
            }
        }

        if(type == 't'){
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade';
            var elements = document.getElementsByClassName('trade');
            tradeElement.innerHTML = `<b> ${data[key].t} <b> ${data[key].p} ${data[key].s}`;
            tradesElement.appendChild(tradeElement);

            if(elements.length > 10){
                tradesElement.removeChild(elements[0]);
            }

            trades.push(data[key].p);
            // console.log(trades);
            var open = trades[0];
            var close = trades[trades.length-1];
            var high = Math.max(...trades);
            var low = Math.min(...trades);

            candleSeries.update({
                time:currentBar.time + 60,
                open:open,
                close:close,
                low:low,
                high:high
            })
        }
        // console.log(data[key])
        if(type == 'b'){
            console.log(data[key]);

            var bar = data[key];
            var timestamp = new Date(bar.t).getTime() / 1000;

            currentBar = {
                "time": timestamp ,
                "open": bar.o,
                "high": bar.h,
                "low": bar.l,
                "close": bar.c
            };

            candleSeries.update(currentBar);
        }
    }
}