// Ported to JS by Robert Miroszewski based on awesome work by Chris Simpson ;)


// defaults
// RF
rfRate = 400
rfExpo = 50
rfAcro = 140

// BF
bfRate=1.0
bfSuper=0.7
bfExpo=0.0

// KISS
kissRcRate=0.7
kissRate=0.7
kissCurve=0.4


// KISS rate function
var kscalc = function(rcCommand, rate, rcCurve, rcRate) {
    kissRpyUseRates = 1 - Math.abs(rcCommand) * rate
    kissRxRaw = rcCommand * 1000
    kissTempCurve = (kissRxRaw * kissRxRaw / 1000000)
    rcCommand = ((rcCommand * kissTempCurve) * rcCurve + rcCommand * (1 - rcCurve)) * (rcRate / 10)
    kissAngle = ((2000.0 * (1.0 / kissRpyUseRates)) * rcCommand) // setpoint is calculated directly here
    return kissAngle
}


// RF rate function
var rfcalc = function(rcCommand, rate, expo, acrop) {
    returnValue = ((1 + 0.01 * expo * (rcCommand * rcCommand - 1.0)) * rcCommand)
    returnValue = (returnValue * (rate + (Math.abs(returnValue) * rate * acrop * 0.01)))
    return returnValue
}


// BF rate calculation function
var bfcalc = function(rcCommand, rcRate, expo, superRate) {
    var clamp = function(n, minn, maxn) {
        return Math.max(Math.min(maxn, n), minn);
    }

    var absRcCommand = Math.abs(rcCommand);

    if(rcRate > 2.0)
        rcRate = rcRate + (14.54 * (rcRate - 2.0))

    if(expo != 0)
        rcCommand = rcCommand * Math.abs(rcCommand)**3 * expo + rcCommand * (1.0 - expo)

    angleRate = 200.0 * rcRate * rcCommand;
    if(superRate != 0){
        rcSuperFactor = 1.0 / (clamp(1.0 - absRcCommand * (superRate)), 0.01, 1.00))
        angleRate *= rcSuperFactor
    }

    return angleRate
}

var reset_button_on_clicked = function() {
    rfrate_slider.reset()
    rfexpo_slider.reset()
    rfacrop_slider.reset()
    bfrate_slider.reset()
    bfexpo_slider.reset()
    bfsuper_slider.reset()
    ksrate_slider.reset()
    kscurve_slider.reset()
    ksrcrate_slider.reset()
}
function calcFromRF() {
    var ratesAPI = "https://api.apocolipse.com/rates?";
    $.getJSON( ratesAPI, {
        t: "rf",
        p1: parseFloat($('#rfRate').val(), 10),
        p2: parseFloat($('#rfExpo').val(), 10),
        p3: parseFloat($('#rfAcro').val(), 10)
      })
        .done(function( data ) {
            console.log(data);
            data = data.replace(/\'/g, '"');
            handleBruteForceResponse(JSON.parse(data));

        });
}

function calcFromBF() {
    var ratesAPI = "https://api.apocolipse.com/rates?";
    $.getJSON( ratesAPI, {
        t: "bf",
        p1: parseFloat($('#bfRate').val(), 10),
        p2: parseFloat($('#bfExpo').val(), 10),
        p3: parseFloat($('#bfSuper').val(), 10)
      })
        .done(function( data ) {
            console.log(data);
            data = data.replace(/\'/g, '"');
            handleBruteForceResponse(JSON.parse(data));

        });
}

function calcFromKiss() {
    var ratesAPI = "https://api.apocolipse.com/rates?";
    $.getJSON( ratesAPI, {
        t: "ks",
        p1: parseFloat($('#kissRate').val(), 10),
        p2: parseFloat($('#kissCurve').val(), 10),
        p3: parseFloat($('#kissRcRate').val(), 10)
      })
        .done(function( data ) {
            console.log(data);
            data = data.replace(/\'/g, '"');
            handleBruteForceResponse(JSON.parse(data));

        });
}

function handleBruteForceResponse(data) {
    $('#rfRate').val(parseFloat(data['rfRate'], 10)).change();
    $('#rfExpo').val(parseFloat(data['rfexpo'], 10)).change();
    $('#rfAcro').val(parseFloat(data['rfacroPlus'], 10)).change();
    $('#bfRate').val(parseFloat(data['bfrcRate'], 10)).change();
    $('#bfExpo').val(parseFloat(data['bfexpo'], 10)).change();
    $('#bfSuper').val(parseFloat(data['bfsuperRate'], 10)).change();
    $('#kissRate').val(parseFloat(data['ksrate'], 10)).change();
    $('#kissCurve').val(parseFloat(data['ksrcCurve'], 10)).change();
    $('#kissRcRate').val(parseFloat(data['ksrcRate'], 10)).change();
}
function drawChart() {
    rfRate = parseFloat($('#rfRate').val(), 10);
    rfExpo = parseFloat($('#rfExpo').val(), 10);
    rfAcro = parseFloat($('#rfAcro').val(), 10);
    bfRate = parseFloat($('#bfRate').val(), 10);
    bfExpo = parseFloat($('#bfExpo').val(), 10);
    bfSuper = parseFloat($('#bfSuper').val(), 10);
    kissRate = parseFloat($('#kissRate').val(), 10);
    kissCurve = parseFloat($('#kissCurve').val(), 10);
    kissRcRate = parseFloat($('#kissRcRate').val(), 10);

    // console.log(rfRate, rfExpo, rfAcro);
    // console.log(bfRate, bfExpo, bfSuper);
    // console.log(kissRate, kissCurve, kissRcRate);

    var ratesData = [];

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Stick Input');
    data.addColumn('number', 'RF');
    data.addColumn('number', 'BF');
    data.addColumn('number', 'KISS');

    for (var i = 0; i <= 1; i+=0.01) {
        data.addRow([
            i,
            rfcalc(i, rfRate, rfExpo, rfAcro),
            bfcalc(i, bfRate, bfExpo, bfSuper),
            kscalc(i, kissRate, kissCurve, kissRcRate)
        ]);
    }

    var i = 1;
    data.addRow([
        i,
        rfcalc(i, rfRate, rfExpo, rfAcro),
        bfcalc(i, bfRate, bfExpo, bfSuper),
        kscalc(i, kissRate, kissCurve, kissRcRate)
    ]);

    var options = {
        width: 900,
        height: 500,
        titlePosition: 'none',
        curveType: 'function',
        legend: {
            position: 'bottom',
            textStyle: {color: "#888"}
        },
        backgroundColor: { fill:'transparent' },
        hAxis: {
            baselineColor: "#888",
            gridlines: {color: "#888"},
            textStyle: {color: "#888"}
        },
        vAxis: {
            baselineColor: "#888",
            gridlines: {color: "#888"},
            textStyle: {color: "#888"}
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
  }

$( document ).ready(function() {
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);


    $('#rfRateSlider').on('input', function() {
        $('#rfRate').val(this.value).change();
    });
    $('#rfExpoSlider').on('input', function() {
        $('#rfExpo').val(this.value).change();
    });
    $('#rfAcroSlider').on('input', function() {
        $('#rfAcro').val(this.value).change();
    });

    $('#bfRateSlider').on('input', function() {
        $('#bfRate').val(this.value).change();
    });
    $('#bfExpoSlider').on('input', function() {
        $('#bfExpo').val(this.value).change();
    });
    $('#bfSuperSlider').on('input', function() {
        $('#bfSuper').val(this.value).change();
    });

    $('#kissRcRateSlider').on('input', function() {
        $('#kissRcRate').val(this.value).change();
    });
    $('#kissRateSlider').on('input', function() {
        $('#kissRate').val(this.value).change();
    });
    $('#kissCurveSlider').on('input', function() {
        $('#kissCurve').val(this.value).change();
    });



    $('#rfRate').on('input change paste keyup', function() {
        $('#rfRateSlider').val(this.value).change();
    });
    $('#rfExpo').on('input', function() {
        $('#rfExpoSlider').val(this.value).change();
    });
    $('#rfAcro').on('input', function() {
        $('#rfAcroSlider').val(this.value).change();
    });

    $('#bfRate').on('input', function() {
        $('#bfRateSlider').val(this.value).change();
    });
    $('#bfExpo').on('input', function() {
        $('#bfExpoSlider').val(this.value).change();
    });
    $('#bfSuper').on('input', function() {
        $('#bfSuperSlider').val(this.value).change();
    });

    $('#kissRcRate').on('input', function() {
        $('#kissRcRateSlider').val(this.value).change();
    });
    $('#kissRate').on('input', function() {
        $('#kissRateSlider').val(this.value).change();
    });
    $('#kissCurve').on('input', function() {
        $('#kissCurveSlider').val(this.value).change();
    });


    $(".input-field").on("change paste keyup", function() {
        drawChart();
     });
});
