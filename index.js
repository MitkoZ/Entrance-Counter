
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var onlineUsers = 0;
var doorOneCounter = 0;
var doorTwoCounter = 0;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sensor', function (req, res) {
  doorOneCounter += Number(req.query.value);
  io.emit('doorOne', doorOneCounter);
  res.send('OK:' + req.query.value);
});

app.get('/sensortwo', function (req, res) {
  doorTwoCounter += Number(req.query.value);
  io.emit('doorTwo', doorTwoCounter);
  res.send('Door2 OK:' + req.query.value);
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});


io.on('connection', function (socket) {
  // console.log('a user connected');
  onlineUsers++;
  io.emit('onlineUserCount', onlineUsers);
  socket.on('disconnect', function () {
    // console.log('user disconnected');
    if (onlineUsers > 0)
      onlineUsers--;
    io.emit('onlineUserCount', onlineUsers);
  });
});