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

    if(rcRate > 2.0)
        rcRate = rcRate + (14.54 * (rcRate - 2.0))

    if(expo != 0)
        rcCommand = rcCommand * Math.abs(rcCommand)**3 * expo + rcCommand * (1.0 - expo)

    angleRate = 200.0 * rcRate * rcCommand;
    if(superRate != 0){
        rcSuperFactor = 1.0 / (clamp(1.0 - (Math.abs(rcCommand) * (superRate)), 0.01, 1.00))
        angleRate *= rcSuperFactor
    }

    return angleRate
}

// var sliders_on_changed = function() {
//     // setup ararys for new plots
//     rfplot = [rfcalc(g, rfrate_slider.val, rfexpo_slider.val,  rfacrop_slider.val)  for g in t]
//     bfplot = [bfcalc(g, bfrate_slider.val, bfexpo_slider.val,  bfsuper_slider.val)  for g in t]
//     ksplot = [kscalc(g, ksrate_slider.val, kscurve_slider.val, ksrcrate_slider.val) for g in t]

//     // set lines to new plots
//     rfline.set_ydata(rfplot)
//     bfline.set_ydata(bfplot)
//     ksline.set_ydata(ksplot)
//     // updte min/max values
//     rfmax = np.array(rfplot).max()
//     bfmax = np.array(bfplot).max()
//     ksmax = np.array(ksplot).max()
//     rfmin = np.array(rfplot).min()
//     bfmin = np.array(bfplot).min()
//     ksmin = np.array(ksplot).min()
//     ax.set_ylim([np.array([rfmin, bfmin, ksmin]).min(), np.array([rfmax, bfmax, ksmax]).max()])

//     // update canvas
//     fig.canvas.draw_idle()
// }

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

function drawChart() {
    rfRate = parseFloat($('input[name=rfRate]').val(), 10);
    rfExpo = parseFloat($('input[name=rfExpo]').val(), 10);
    rfAcro = parseFloat($('input[name=rfAcro]').val(), 10);
    bfRate = parseFloat($('input[name=bfRate]').val(), 10);
    bfExpo = parseFloat($('input[name=bfExpo]').val(), 10);
    bfSuper = parseFloat($('input[name=bfSuper]').val(), 10);
    kissRate = parseFloat($('input[name=kissRate]').val(), 10);
    kissCurve = parseFloat($('input[name=kissCurve]').val(), 10);
    kissRcRate = parseFloat($('input[name=kissRcRate]').val(), 10);
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

    //var chart = new google.visualization.Line(document.getElementById('curve_chart'));
    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
  }

$( document ).ready(function() {
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    $(".input-field").on("change paste keyup", function() {
        drawChart();
     });
});