/*
server websockets pour maxmsp
- maxmsp envoie des messages aux blocks pour qu'ils executent des process shell
tourne sur le mac
*/
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const Max = require('max-api');
var fs = require('fs');
var spawn = require('child_process').spawn;

var blocks_config = [
	{
		"id":0,
		"source":null,
		"ip":"192.168.2.20",
		"port":1234,
		"status":null
	},
	{
		"id":1,
		"source":null,
		"ip":"192.168.2.201",
		"port":1234,
		"status":null
	},
	{
		"id":2,
		"source":null,
		"ip":"192.168.2.202",
		"port":1234,
		"status":null
	},
	{
		"id":3,
		"source":null,
		"ip":"192.168.2.203",
		"port":1234,
		"status":null
	},
	{
		"id":4,
		"source":null,
		"ip":"192.168.2.204",
		"port":1234,
		"status":null
	},
	{
		"id":5,
		"source":null,
		"ip":"192.168.2.205",
		"port":1234,
		"status":null
	}
];

Max.addHandler("startListenAll", () => {
	io.sockets.emit('new message',{ description: 'startListenAll'});
});

Max.addHandler("start", ( index, input_type, input, channel ) => {
    
	io.sockets.emit( 'new message',{ description: 'start', metas: blocks_config[index] } );
    
    startEncoder( index, input_type, input, channel );
    
});
Max.addHandler("stop", ( index ) => {
	io.sockets.emit( 'new message',{ description: 'stop', metas: blocks_config[index] } );
    
    stopEncoder( index );
});

Max.addHandler("stopAll", () => {
	io.sockets.emit('new message',{ description: 'stopAll'});
});

io.on('connection', (socket) => {
	var block_ip = socket.conn.remoteAddress.replace("::ffff:","");
	
	console.log('a block connected ' + block_ip);
	
	socket.emit( 'set_config', blocks_config );
	
	socket.on('disconnect', function () {
		console.log('Block ' + block_ip + 'disconnected');
	});	
});

http.listen(3000, () => {
	Max.post(`listening on *:3000`);
	console.log('listening on *:3000');
});


function stopEncoder( id ){
	Max.post( `stopping ` + blocks_config[id].ip );
	
	//console.log( blocks[id].status );
	
	if( blocks_config[id].status ){
		blocks_config[id].status.kill('SIGHUP');
		blocks_config[id].status = null;
		Max.post( blocks_config[id].ip + ` stopped` );
	}    
    
}


function startEncoder( id, input_type, input, channel ){
	
	console.log( "Starting encoder ...." );
	blocks_config[id].source = input;
	
    Max.outlet(id);
	
	if( blocks_config[id].status ){
		Max.post( `Block déjà actif ` );
		return false;
	}
	
	var blockDest_ip = blocks_config[id].ip;
	
	var cmd = '/usr/local/bin/ffmpeg';
	
	var args;
    
	if( input_type === "input" ){
		Max.post( `input live` );
		
        args = [
			'-f', 'avfoundation',
			'-i', blocks_config[id].source, // -i ":1"
			'-map_channel', '0.0.'+channel,
			//'-bufsize','32k',
			'-q:a', '7',
			//'-b:a', '32k',
			'-f','mpegts', 'udp://'+blockDest_ip+':'+blocks_config[id].port
		];
        
	} else {
		Max.post( `input fichier` );
		//ffmpeg -re -i 01.mp3 -acodec mp2 -tune zerolatency -ab 96k -ac 1 -f rtp rtp://192.168.2.20:1234

        args = [
			'-re',
			'-i', blocks_config[id].source,
            '-hide_banner',
			'-acodec', 'mp2', 
			'-tune', 'zerolatency', 
            '-ab', '96k',
            '-ac', '1',
			'-f', 'rtp', 'rtp://'+blockDest_ip+':'+blocks_config[id].port
		];
	}
	//console.log( args );
    
	var proc = spawn(cmd, args);
    
	//console.log( proc );
    
	blocks_config[id].status = proc; //proc_pid;
	
	Max.post( `streaming on ` + blockDest_ip );

	proc.stdout.on('data', function(data) {
    	//console.log(data);
	});

	proc.stderr.setEncoding("utf8")
	proc.stderr.on('data', function(data) {
    	//console.log(data);
        console.log('Encoder error');
	});

	proc.on('close', function() {
    	console.log('Encoder stopped');
	});    
}

