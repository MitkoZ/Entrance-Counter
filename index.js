var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var Base64 = require('js-base64').Base64;

app.use(bodyParser.json());

var currentOnlineUsers = 0;
const timeToCalculateAverageFor = 20;

var doorOneCounter = 0;
var doorOneAverage = 0;

var doorTwoCounter = 0;
var doorTwoAverage = 0;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/submitData', function (req, res) {
  var requestBody = req.body;
  var device = requestBody.dev_id;
  var receivedValue = Number(requestBody.payload_raw);
  if (receivedValue < 0) {
    res.status(400).send("Negative new steps are not accepted");
    return;
  }

  switch (device) {
    case 'doorOne':
    case 'doorTwo':
      incrementAverageDoorSteps(device, receivedValue, timeToCalculateAverageFor);
      emitAverageDoorSteps(device);
      res.end();
      break;
    default:
      throw new Error("Device not handled");

  }
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});


io.on('connection', function (socket) {
  currentOnlineUsers++;
  io.emit('onlineUserCount', currentOnlineUsers);
  io.emit("doorOne", doorOneAverage);
  io.emit("doorTwo", doorTwoAverage);
  socket.on('disconnect', function () {
    // console.log('user disconnected');
    if (currentOnlineUsers > 0)
      currentOnlineUsers--;
    io.emit('onlineUserCount', currentOnlineUsers);
  });
});

function incrementAverageDoorSteps(door, receivedValue, timeInMinutesToCalculateFor) {
  switch (door) {
    case "doorOne":
      doorOneCounter += receivedValue;
      doorOneAverage = doorOneCounter / timeInMinutesToCalculateFor;
      setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, door, receivedValue, timeInMinutesToCalculateFor);
      break;
    case "doorTwo":
      doorTwoCounter += receivedValue;
      doorTwoAverage = doorTwoCounter / timeInMinutesToCalculateFor;
      setTimeout(decrementAverageDoorSteps, timeInMinutesToCalculateFor * 60 * 1000, door, receivedValue, timeInMinutesToCalculateFor);
      break;
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
  }
}

function emitAverageDoorSteps(door) {
  switch (door) {
    case "doorOne":
      io.emit("doorOne", doorOneAverage);
      break;
    case "doorTwo":
      io.emit("doorTwo", doorTwoAverage);
      break;
  }
}
