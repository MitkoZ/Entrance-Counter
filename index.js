const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const Base64 = require('js-base64').Base64;
const schedule = require('node-schedule');
const config = require('./config.js');

app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

let currentOnlineUsers = 0;

let doorOneCounter = 0;
let doorOneAverage = 0;

let doorTwoCounter = 0;
let doorTwoAverage = 0;

let doorOnePassedThroughToday = 0;
let doorTwoPassedThroughToday = 0;

let currentNoiseValue = 0;

let airDustinessData = [
    //[[{hour}, {minutes}, {seconds}], {particles}] - format
    // mock data
    // [[23, 2, 14], 35],
    // [[21, 7, 59], 133],
    // [[5, 23, 0], 193],
    // [[14, 2, 45], 4],
    // [[13, 2, 21], 67],
    // [[11, 2, 27], 46],
    // [[23, 50, 44], 134],
    // [[10, 2, 55], 22],
    // [[9, 2, 41], 135],
    // [[1, 2, 0], 76],
    // [[2, 2, 31], 14],
    // [[4, 2, 59], 75],
    // [[5, 2, 4], 34],
    // [[0, 2, 46], 96],
    // [[1, 1, 25], 0]
];

let latestAirDustinessParticles = 0;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get("/getDoorAverageMinutes", (req, res) => {
    res.status(200).json(config.timeToCalculateAverageFor);
})

app.get("/getAllDustParticles", function (req, res) {
    res.status(200).json(airDustinessData);
});

app.get("/getLatestDustParticles", function (req, res) {
    res.status(200).json(latestAirDustinessParticles)
});

app.post('/submitData', function (req, res) {
    let requestBody = req.body;
    let sensorId = requestBody.dev_id;
    let receivedValue = Number(requestBody.payload_raw);

    switch (sensorId) {
        case config.doorOneSensorId:
        case config.doorTwoSensorId:
            if (receivedValue < 0) {
                res.status(400).send("Negative value for count of steps is not allowed");
                return;
            }
            incrementAverageDoorSteps(sensorId, receivedValue, config.timeToCalculateAverageFor);
            emitAverageDoorSteps(sensorId);
            res.end();
            break;
        case config.noiseSensorId:
            if (receivedValue < 0) {
                res.status(400).send("Negative values for noise are not allowed");
                return;
            }
            currentNoiseValue = receivedValue;
            io.emit("noiseData", currentNoiseValue);
            res.end();
            break;
        case config.airDustinessSensorId:
            if (receivedValue < 0) {
                res.status(400).send("Negative air dust particles data is not allowed");
                return;
            }
            var dustParticle = receivedValue;
            latestAirDustinessParticles = receivedValue;
            var dateNow = new Date();
            var dustParticleAndHour = [[dateNow.getHours(), dateNow.getMinutes(), dateNow.getSeconds()], dustParticle];
            airDustinessData.push(dustParticleAndHour);
            setTimeout(removeDustData, config.removeDustDataAfter, dateNow);
            io.emit("onDustParticlesSensor", dustParticleAndHour);
            io.emit("onLatestDustParticlesDataUpdated", latestAirDustinessParticles);
            res.end();
            break;
        default:
            throw new Error(`${sensorId} is not handled in the switch`);

    }
});

io.on('connection', function (socket) {
    currentOnlineUsers++;
    io.emit('onlineUserCount', currentOnlineUsers);
    io.emit("doorOne", doorOneAverage, doorOnePassedThroughToday);
    io.emit("doorTwo", doorTwoAverage, doorTwoPassedThroughToday);
    io.emit("noiseData", currentNoiseValue);
    io.emit("latestDustParticles", latestAirDustinessParticles);

    socket.on('disconnect', function () {
        if (currentOnlineUsers > 0)
            currentOnlineUsers--;
        io.emit('onlineUserCount', currentOnlineUsers);
    });
});

let resetDoorsPassedThroughCron = schedule.scheduleJob(config.resetDoorTotalAfter, function () {
    doorOnePassedThroughToday = 0;
    doorTwoPassedThroughToday = 0;
    io.emit("doorOne", doorOneAverage, doorOnePassedThroughToday);
    io.emit("doorTwo", doorTwoAverage, doorTwoPassedThroughToday);
})

function incrementAverageDoorSteps(sensorId, receivedValue, timeInMinutesToCalculateFor) {
    switch (sensorId) {
        case config.doorOneSensorId:
            doorOnePassedThroughToday += receivedValue;
            doorOneCounter += receivedValue;
            doorOneAverage = doorOneCounter / timeInMinutesToCalculateFor;
            setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, sensorId, receivedValue, timeInMinutesToCalculateFor);
            break;
        case config.doorTwoSensorId:
            doorTwoPassedThroughToday += receivedValue;
            doorTwoCounter += receivedValue;
            doorTwoAverage = doorTwoCounter / timeInMinutesToCalculateFor;
            setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, sensorId, receivedValue, timeInMinutesToCalculateFor);
            break;
    }
}

function emitAverageDoorSteps(sensorId) {
    switch (sensorId) {
        case config.doorOneSensorId:
            io.emit("doorOne", doorOneAverage, doorOnePassedThroughToday);
            break;
        case config.doorTwoSensorId:
            io.emit("doorTwo", doorTwoAverage, doorTwoPassedThroughToday);
            break;
    }
}

function decrementAverageDoorSteps(sensorId, valueToDecrementWith, timeInMinutesToCalculateFor) {
    switch (sensorId) {
        case config.doorOneSensorId:
            doorOneCounter -= valueToDecrementWith;
            doorOneAverage = doorOneCounter / timeInMinutesToCalculateFor;
            emitAverageDoorSteps(sensorId);
            break;
        case config.doorTwoSensorId:
            doorTwoCounter -= valueToDecrementWith;
            doorTwoAverage = doorTwoCounter / timeInMinutesToCalculateFor;
            emitAverageDoorSteps(sensorId);
            break;
        default:
            throw new Error(`${sensorId} is not handled in the switch`);
    }
};

function removeDustData(date) {
    var date = {
        "hours": date.getHours(),
        "minutes": date.getMinutes(),
        "seconds": date.getSeconds()
    };
    var index = airDustinessData.findIndex(x => x[0][0] === date.hours && x[0][1] === date.minutes && x[0][2] === date.seconds);
    airDustinessData.splice(index, 1);
    io.emit("onDustParticlesDataUpdated", airDustinessData);
    changeLatestDustData();
    io.emit("onLatestDustParticlesDataUpdated", latestAirDustinessParticles);
};

function changeLatestDustData() {
    if (airDustinessData.length == 0) {
        latestAirDustinessParticles = 0;
    }
}

http.listen(config.port, function () {
    console.log(`listening on *:${config.port}`);
});