// Global variables

// used to keep color pallete
var color = {
    base : {  background: "#ffcb38" , circle: "#FDF9C4"},
    success : {  background: "#b6e27b" , circle: "#fff682"},
    fail : {  background: "#FF5722" , circle: "#ffbaa5"}
}

var PieChartData = {
    labels: ["Success","Fail"],
    datasets: [{
            data: [1, 2],
            backgroundColor: ["#36A2EB","#FF6384"]
        }]
}

// used to store time for stopwatch
var finalTime = { min : 20, sec:0, totalSec:1200};

// used to store current plant detail for stopwatch
var currentPlant = 0;
var currentSet = 20;

// used by setInterval to store id, so that it can be cleared later.
var timer = null;

//var to keep screen unlock - lock track
var screenSleep = false;

var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        document.addEventListener('resume', this.onDeviceResume.bind(this), false);
        document.addEventListener('backbutton',router.onBack, false);
    },

    onDeviceResume: function() {
        
        if(!screenSleep)
        {
            track.fail();
        }
        screenSleep = false;
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {      }
};

app.initialize();

function setScreenSleep(e)
{
    screenSleep = e;
}

var router = {
    currentPage: '',

    onBack : function()
    {
        if(router.currentPage == 'home')
        {
            track.stop();
            router.currentPage = '';
        }
        else if(router.currentPage == 'finish')
        {
            track.initState();
            router.currentPage = '';
        }
        else if(router.currentPage == 'garden')
        {
            $("#garden").hide();
            $("#home").fadeIn();
            track.initState();
            router.currentPage = '';
        }
        else if(router.currentPage == 'stats')
        {
            $("#stats").hide();
            $("#home").fadeIn();
            track.initState();
            router.currentPage = '';
        }
        else
        {
            navigator.app.exitApp();
        }
    },

    garden: function(){
        $("#home").hide();
        $("#garden").fadeIn();
        router.currentPage = 'garden';
    },

    stats: function(){
        $("#home").hide();
        $("#stats").fadeIn();
        router.currentPage = 'stats';
        stats.renderPage();
    }
 
}

// initial setup of roundSlider UI

$("#slider").roundSlider({
    width: 8,
    sliderType: "min-range",
    handleShape: "round",
    handleSize: "+25",
    step: 10,
    max : 60,
    value: "20",
    radius: 140,
    drag: "setTime",
    change: "setTime"
});

// call back function for hooks of roundSlider 
function setTime(e)
{
    val = e.value;
    currentPlant = 0;

    if(val == 0)
    {
        $("#slider").roundSlider('setValue',10);
        val = 10;
    }
    
    $("#plant-container img").attr("src","img/"+plants[val][currentPlant]+"/100.png");
    $('.time h1').text(val+":00")

    finalTime.min = val;
    finalTime.sec = 0;
    finalTime.totalSec = finalTime.min * 60;
    currentSet = val;
}

var track = {

    initState: function(){

        $(".time h1").text("20:00");
        $(".time").show();

        $("body").css("background",color.base.background);
        $("#plant-container").css("background",color.base.circle);
        $(".message h2").hide();
        $(".btn").hide();
        $("#startBtn").show();

        $("#plant-container img").attr("src","img/"+plants[currentSet][currentPlant]+"/100.png");

        clearInterval(timer);
        timer = null;

        $("#slider").roundSlider({
            readOnly : false,
            step : 10,
            value: "20"
        });
        
    },

    // initialization of timer by clicking start
    start : function(){

        router.currentPage = 'home';

        $("#startBtn").hide();
        $("#stopBtn").fadeIn();

        $("#slider").roundSlider({
            readOnly : true,
            step : 1
        });
        
        timer = setInterval(function(){

            track.trackGrowth();

            if(finalTime.sec > 0)
            {
                finalTime.sec = finalTime.sec - 1;

                if(finalTime.sec > 9)
                {
                    $('.time h1').text(finalTime.min+":"+finalTime.sec);
                }
                else
                {
                    $('.time h1').text(finalTime.min+":0"+finalTime.sec)
                } 
            }
            else
            {

                if(finalTime.min > 0)
                {
                    finalTime.min = finalTime.min - 1;
                    finalTime.sec = 59;

                    $('.time h1').text(finalTime.min+":"+finalTime.sec)
                    $("#slider").roundSlider('setValue',finalTime.min);
                }
                else
                {
                    track.success();
                }
            }

        }, 1000);

    },

    success : function(){
        
        router.currentPage = 'finish';

        $("#stopBtn").hide(); 
        $(".time").hide();

        $("body").css("background",color.success.background);
        $("#plant-container").css("background",color.success.circle);
        $(".message .success").fadeIn();
        $("#gardenBtn").fadeIn();
        
        clearInterval(timer);

        $("#slider").roundSlider('setValue',60);
        
        stats.addNewPlant();
        stats.time = stats.time + finalTime.totalSec;
        stats.score = stats.time + (finalTime.totalSec*(currentSet/10));
        stats.success = stats.success + 1;

        stats.commit();
    },

    fail: function(){

        $("#stopBtn").hide(); 
        $("#startBtn").hide();
        $("#tryBtn").fadeIn();

        $(".time").hide();

        $("body").css("background",color.fail.background);
        $("#plant-container").css("background",color.fail.circle);
        $(".message .fail").fadeIn();
        
        $("#plant-container img").attr("src","img/"+plants[currentSet][currentPlant]+"/die.png");
        
        clearInterval(timer);

        $("#slider").roundSlider('setValue',60);

        stats.fail = stats.fail + 1;
        stats.commit();
    },

    stop : function(){

        var result = confirm("If you quit your little plant will die, quit ?");
        if(result == true)
        {
            track.fail();
        }
    },

    changePlant : function(){

        if (timer != null) return;

        if(currentPlant < plants[currentSet].length-1)
        {
            currentPlant = currentPlant + 1;
        }
        else
        {
            currentPlant = 0;
        }

        $("#plant-container img").attr("src","img/"+plants[currentSet][currentPlant]+"/100.png");
    
    },

    trackGrowth: function(){

        var seconds = (finalTime.min*60)+finalTime.sec;
        var progress = 100 - ((seconds/finalTime.totalSec)*100);

        var tmp = "img/"+plants[currentSet][currentPlant]+"/";

        if(progress<30)
        {
            $("#plant-container img").attr("src",tmp+"30.png");
        }
        else if(progress<60)
        {
            $("#plant-container img").attr("src",tmp+"60.png");
        }
        else
        {
            $("#plant-container img").attr("src",tmp+"100.png");
        }
    }

}

var stats = {

    time : 0,
    score : 0,
    success : 0,
    fail : 0,

    init : function(){
        if(localStorage.zen)
        {
            stats.zen = JSON.parse(localStorage.zen);
            stats.time = stats.zen.time || 0;
            stats.score = stats.zen.score || 0;
            stats.success = stats.zen.success || 0;
            stats.fail = stats.zen.fail || 1;
        }
        else
        {
            stats.zen = {}; stats.zen.plants = [];
            localStorage.setItem("zen",JSON.stringify(stats.zen));
        }
    },

    totalPlants : function(){},
    successRate : function(){
        var percent = (stats.success/(stats.success+stats.fail))*100;
        return percent.toFixed(1);
    },

    renderGraphs : function()
    {
        PieChartData.datasets[0].data = [stats.success,stats.fail];

        var myPieChart = new Chart($("#chart").get(0).getContext("2d"),{
                            type: 'doughnut',
                            data: PieChartData
                        });
    },

    renderPage : function(){

        if(stats.time/60 > 60)
        {
            var hr = ((stats.time/3600)+"").split('.')[0];
            var min = stats.time%60;

            $(".firstBlock p:first-child").text(hr+"H "+min+"M");
        }
        else
        {
            var min = (stats.time/60).toFixed(0);

            $(".firstBlock p:first-child").text(min+" Min");
        }

        $(".thirdBlock p:first-child").text(stats.zen.plants.length);

        $(".secondBlock p").text("Success rate "+stats.successRate()+"%");
        stats.renderGraphs();
    },

    commit : function(){
        
        stats.zen.time = stats.time;
        stats.zen.score = stats.score;
        stats.zen.success = stats.success;
        stats.zen.fail = stats.fail;

        localStorage.setItem("zen",JSON.stringify(stats.zen));
    },

    populateGarden : function()
    {
        var plants = stats.zen.plants;

        for(var i = 0; i < plants.length; i++)
        {
            $("#garden ."+zen.plants[i]).css('opacity','1.0');
        }
    },

    addNewPlant: function()
    {
        var temp_plants = stats.zen.plants;
        
        if(temp_plants.indexOf(plants[currentSet][currentPlant])==-1)
        {
            temp_plants.push(plants[currentSet][currentPlant]);
        }

        stats.commit();
    }
}

$("#startBtn").click(track.start);
$("#stopBtn").click(track.stop);
$("#tryBtn").click(track.initState);
$("#plant-container").click(track.changePlant);
$("#gardenBtn").click(router.garden);
$("#statsBtn").click(router.stats);
stats.init();