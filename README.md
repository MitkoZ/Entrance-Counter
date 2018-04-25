# Entrance-Counter
Counts the amount of people that have passed through doors, noise decibels and air dustiness particles.
## Getting Started

### Prerequisites
The things that you will need are `NodeJs`, `NPM` and some program that you can use for making post requests (for testing purposes) like `Postman`.

### Installing
To clone the repository open a `git` terminal and write `git clone https://github.com/MitkoZ/Entrance-Counter.git` (HTTPs) or `git clone git@github.com:MitkoZ/Entrance-Counter.git` (SSH).

To start the project open a terminal, go to the project's directory and then run `node index.js`.
Example:
```
cd /d D:\Entrance-Counter 
node index.js
```
You will get a message in the terminal. ```listening on *:3000```. The project is ready and running. Just open a browser and go to port 3000. 
`http://localhost:3000/`

### Sending data
The data is sent via JSON.
Open `Postman`. The endpoint for sending data is `/submitData`.
The `dev_id` parameter is the device id and `payload_raw` is the actual data that you are sending.
The possible device ids are `doorOneSensor, doorTwoSensor, airDustinessSensor and noiseSensor`
Let's send some data simulating that people have passed through door one.
Make a post request to `http://localhost:3000/submitData` with the JSON

```
{
	"dev_id" : "doorOneSensor",
	"payload_raw" : 3
}
```

The same way for door two.

```
{
	"dev_id" : "doorTwoSensor",
	"payload_raw" : 15
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
