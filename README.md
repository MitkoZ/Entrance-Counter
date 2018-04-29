# Entrance-Counter
Counts the amount of people that have passed through doors, noise decibels and air dustiness particles.
## Getting Started

### Prerequisites
The things that you will need are `NodeJs`, `NPM` and some program that you can use for making post requests (for testing purposes) like `Postman`.

### Installing
To clone the repository open a `git` terminal and write `git clone https://github.com/MitkoZ/Entrance-Counter.git` (HTTPs) or `git clone git@github.com:MitkoZ/Entrance-Counter.git` (SSH).

Open a terminal, go to the project's directory and run `npm install`, so that the npm packages declared in the package.json can get downloaded.

Example:
```
cd /d D:\Entrance-Counter 
npm install
```

To start the project run `node index.js`.
```
node index.js
```
You will get a message in the terminal ```listening on *:8080``` (port may vary depending on the config file). The project is ready and running. Just open a browser and go to port 8080. 
`http://localhost:8080/`

### Sending data
The data is sent via JSON.
Open `Postman`. The endpoint for sending data is `/submitData`.
The `dev_id` parameter is the device id and `payload_raw` is the actual data that you are sending.
The possible device ids are `doorOneSensor, doorTwoSensor, airDustinessSensor and noiseSensor`
Let's send some data simulating that people have passed through door one.
Make a post request to `http://localhost:8080/submitData` with the JSON

```
{
	"dev_id" : "doorOneSensor",
	"payload_raw" : 35
}
```

The same way for door two.

```
{
	"dev_id" : "doorTwoSensor",
	"payload_raw" : 55
}
```

Now for the air dustiness sensor

```
{
	"dev_id" : "airDustinessSensor",
	"payload_raw" : 300
}
```

and for the noise sensor

```
{
	"dev_id" : "noiseSensor",
	"payload_raw" : 1500
}
```

### Configuration
If you want to configure some of the sensor ids, the average people passed per minute for the last XXX minutes from the doors, the time of removing of each dust particle, the port of the server or the reset time of the door total tabs, that can be done from the `config.js` file. 

For example if you want your "doorOneSensor" to be called "blah_blah" just change this line 

```exports.doorOneSensorId = "doorOneSensor";``` 

to 

`exports.doorOneSensorId = "blah_blah";`

(PS: If you are already running the server, restart it for the configuration to take effect.)

This way when sending the JSON the dev_id will be "blah_blah"

```
{
	"dev_id" : "blah_blah",
	"payload_raw" : 35
}
```

### Built With
* NodeJS
* Express.js
* Socket.IO
* body-parser
* js-base64
* node-schedule

### Authors
* Dimitar Zahariev - [GitHub](https://github.com/MitkoZ)
* Lyubomir Parvanov - [GitHub](https://github.com/liubomirwm)
* Petio Naskov - [GitHub](https://github.com/petiofiiito)
