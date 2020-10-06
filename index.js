/*
script de démarrage CLIENT stream block
- recoit des messages websockets puis execute des process shell
tourne sur les blocks
*/
const IP_ordi_thomas = '192.168.2.7';
const port = '3000';

const io = require('socket.io-client');
const socket = io('http://'+IP_ordi_thomas+':'+port);
var spawn = require('child_process').spawn;
var isplaying = false;
var proc = null;

var os = require( 'os' );
var networkInterfaces = Object.values(os.networkInterfaces())
    .reduce((r,a)=>{
        r = r.concat(a)
        return r;
    }, [])
    .filter(({family, address}) => {
        return family.toLowerCase().indexOf('v4') >= 0 && address !== '127.0.0.1'
    })
    .map(({address}) => address);
var ipAddresses = networkInterfaces.join(', ');

var myadresse = ipAddresses;

        
socket.on('connect', () => {
    console.log( "connected" );
});

socket.on('set_config', (config) => {
	//console.log( config[0] );
});

socket.on('new message', (msg) => {
  
	console.log( 'message reçu => '+ msg.description );
	
	if( msg.description === "startListenAll" ){
	
		console.log("starting ListenAll ...");
		
		if( isplaying ){
		   return false;
		} else {
            // startplayer
            startPlayer();
		}
        
    } else if( msg.description === "start" ){
        var me = msg.metas;
        console.log( me );
        console.log( myadresse );
        if( me.ip === myadresse ){
           
            if( isplaying ){
               return false;
            } else {
                // startplayer
                startPlayer();
            }
        }
        
    } else if( msg.description === "stop" ){
        var me = msg.metas;
        if( me.ip === myadresse ){
                // stopPayer
                stopPlayer();
        }
    
    } else if( msg.description === "stopAll" && isplaying && proc != "" ){
		console.log("stopping ListenAll ...");
        //stopPayer
        stopPlayer();
	}
	
});

function stopPlayer(){
    if( proc ){
        console.log('stopping ...');
        proc.kill();
        proc = null;
        isplaying = false;
    } else {
       console.log('nothing to stop ...'); 
    }
}

function startPlayer(){
    console.log('starting ...');
    var cmd = 'ffplay';
    /*
    args = [
        '-fflags', 'nobuffer', '-flags', 'low_delay', '-framedrop', '-strict', 'experimental',
        'udp://'+IP_ordi_thomas+':'+port
    ];
    */
    args = [
        '-hide_banner', '-loglevel', 'quiet', '-acodec', 'mp2', 'rtp://'+IP_ordi_thomas+':'+1234
    ];


    proc = spawn(cmd, args);
    console.log( "starting proc #" + proc.pid );
    console.log( proc.spawnargs );

    proc.stdout.on('data', function(data) {
        console.log(data);
    });

    proc.stderr.setEncoding("utf8")
    proc.stderr.on('data', function(data) {
        console.log(data);
    });

    proc.on('close', function() {
        console.log('stopped done');
    });

    isplaying = true;
    
}
