const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request,response) => {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(index);
	response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = [];
var curColor = "white";

const onJoined = (sock) => {

	const socket = sock;

	socket.on('join', (data) => {

		const joinMsg = {
			name: 'server',
			msg: `There are ${Object.keys(users).length+1} users online`,
		};

		socket.name = data.name;
		socket.emit('msg', joinMsg);

		//add user to array
		users.push(data.name);
		

		socket.join('room1');

		//anouncement
		const response = {
			name: 'server',
			msg: `${data.name} has joined the room.`,
		};

		socket.broadcast.to('room1').emit('msg', response);

		console.log(`${data.name} joined`);

		//success
		socket.emit('msg', {name: 'server', msg: 'You joined the room'});
		io.sockets.in('room1').emit('updateUsers', {uc: users.length, un: users});
		socket.emit('changeColor', {color: curColor});
	})
};

const onMsg = (sock) => {
	const socket = sock;

	socket.on('msgToServer', (data) =>{
		io.sockets.in('room1').emit('msg',{ name: data.name, msg: data.msg});
		console.log("onMsg");
	});

	socket.on('changeColor', (data)=>{
		io.sockets.in('room1').emit('changeColor',{ color: data.color});
		curColor = data.color;
	})


};

const onDisconnect = (sock) => {
	const socket = sock;

	socket.on('disconnect', (data) =>{
		if(socket.name){

			//remove user from array
			var index = users.indexOf(socket.name);
			users.splice(index,1);

			io.sockets.in('room1').emit('msg',{ name: socket.name, msg: 'DISCONNECTED'});
			io.sockets.in('room1').emit('updateUsers', {uc: users.length, un:users});
			console.log('user disconnected');
		}
	});

};

io.sockets.on('connection', (socket) => {
	console.log('started');
 	
	onJoined(socket);
	onMsg(socket);
	onDisconnect(socket);
});

console.log('Websocket server started');