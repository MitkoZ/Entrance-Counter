const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const Base64 = require('js-base64').Base64;

app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

var currentOnlineUsers = 0;
const timeToCalculateAverageFor = 20;

var doorOneCounter = 0;
var doorOneAverage = 0;

var doorTwoCounter = 0;
var doorTwoAverage = 0;

var currentNoiseValue = 0;

var airDustinessData = [
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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get("/getAllDustParticles", function (req, res) {
    res.status(200).json(airDustinessData);
});

app.post('/submitData', function (req, res) {
    var requestBody = req.body;
    var device = requestBody.dev_id;
    var receivedValue = Number(requestBody.payload_raw);

    switch (device) {
        case "doorOneSensor":
        case "doorTwoSensor":
            if (receivedValue < 0) {
                res.status(400).send("Negative value for count of steps is not allowed");
                return;
            }
            incrementAverageDoorSteps(device, receivedValue, timeToCalculateAverageFor);
            emitAverageDoorSteps(device);
            res.end();
            break;
        case "noiseSensor":
            if (receivedValue < 0) {
                res.status(400).send("Negative values for noise are not allowed");
                return;
            }
            currentNoiseValue = receivedValue;
            io.emit("noiseData", currentNoiseValue);
            res.end();
            break;
        case "airDustinessSensor":
            if (receivedValue < 0) {
                res.status(400).send("Negative air dust particles data is not allowed");
                return;
            }
            var dustParticle = Number(receivedValue);
            var dateNow = new Date();
            var dustParticleAndHour = [[dateNow.getHours(), dateNow.getMinutes(), dateNow.getSeconds()], dustParticle];
            airDustinessData.push(dustParticleAndHour);
            setTimeout(removeData, 43200000, dateNow); // after 12 hours
            io.emit("onDustParticlesSensor", dustParticleAndHour);
            res.end();
            break;
        default:
            throw new Error("Device not handled");

    }
});

io.on('connection', function (socket) {
    currentOnlineUsers++;
    io.emit('onlineUserCount', currentOnlineUsers);
    io.emit("doorOne", doorOneAverage);
    io.emit("doorTwo", doorTwoAverage);
    io.emit("noiseData", currentNoiseValue);

    socket.on('disconnect', function () {
        if (currentOnlineUsers > 0)
            currentOnlineUsers--;
        io.emit('onlineUserCount', currentOnlineUsers);
    });
});

function incrementAverageDoorSteps(door, receivedValue, timeInMinutesToCalculateFor) {
    switch (door) {
        case "doorOneSensor":
            doorOneCounter += receivedValue;
            doorOneAverage = doorOneCounter / timeInMinutesToCalculateFor;
            setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, door, receivedValue, timeInMinutesToCalculateFor);
            break;
        case "doorTwoSensor":
            doorTwoCounter += receivedValue;
            doorTwoAverage = doorTwoCounter / timeInMinutesToCalculateFor;
            setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, door, receivedValue, timeInMinutesToCalculateFor);
            break;
    }
}

function emitAverageDoorSteps(door) {
    switch (door) {
        case "doorOneSensor":
            io.emit("doorOne", doorOneAverage);
            break;
        case "doorTwoSensor":
            io.emit("doorTwo", doorTwoAverage);
            break;
    }
}

function decrementAverageDoorSteps(door, valueToDecrementWith, timeInMinutesToCalculateFor) {
    switch (door) {
        case "doorOne":
            doorOneCounter -= valueToDecrementWith;
            doorOneAverage = doorOneCounter / timeInMinutesToCalculateFor;
            emitAverageDoorSteps("doorOne");
            break;
        case "doorTwo":
            doorTwoCounter -= valueToDecrementWith;
            doorTwoAverage = doorTwoCounter / timeInMinutesToCalculateFor;
            emitAverageDoorSteps("doorTwo");
            break;
        default:
            throw new Error(`${door} is not handled in the switch`);
    }
};

function removeData(date) {
    var date = {
        "hours": date.getHours(),
        "minutes": date.getMinutes(),
        "seconds": date.getSeconds()
    };
    var index = airDustinessData.findIndex(x => x[0][0] === date.hours && x[0][1] === date.minutes && x[0][2] === date.seconds);
    airDustinessData.splice(index, 1);
    io.emit("onDustParticlesDataUpdated", airDustinessData);
};

http.listen(3000, function () {
    console.log('listening on *:3000');
});