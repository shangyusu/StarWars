var tessel = require('tessel');
var rfidlib = require('rfid-pn532');
var rfid = rfidlib.use(tessel.port['A']); 
var http = require('http');

var isRegistered = false;
var readyToRegister = false;
var masterUID = null;
var rivalUId = null;

tessel.button.on('press', function(){
	readyToRegister = !readyToRegister;
	if (readyToRegister && !isRegistered){
		console.log("ready to register.");
		tessel.led[0].output(1);
	}
	else{
		tessel.led[0].output(0);
	}
});

rfid.on('ready', function (version) {
	console.log('Ready to read RFID card');
	rfid.on('data', function(card) {
		console.log('UID:', card.uid.toString('hex'));
  		if(readyToRegister && !isRegistered){
			console.log('registered.');
			masterUID = card.uid.toString('hex');
			console.log('master: ' + masterUID);
			isRegistered = true;
			readyToRegister = false;
			tessel.led[0].output(0);
			tessel.led[1].output(1);
		}
		else if (isRegistered){
			if(card.uid.toString('hex') !== masterUID){
				console.log('new rival!');
				rivalUId = card.uid.toString('hex');
				console.log('rival: ' + rivalUId);
					
				setInterval(function(){
					sendPairing();
				},500);
			}
		}
	});
});

rfid.on('error', function (err) {
	console.error(err);
});

function sendPairing(){
	
	console.log('sending pairing request...');
	var options = {
        hostname: '52.10.182.239',
        port: 80,
        path:'/starwars/pairing',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
    };
	
	var req = http.request(options, function(res) {
    	res.setEncoding('utf8');
    	res.on('data', function () {
        	console.log('Response received.');
        });

        res.on('end', function(){
        });	
    });
	
	var data = {'masterUID': masterUID, 'rivalUID': rivalUId};
	
	req.on('error', function(e) {
        console.log('problem with request: ', e.message);
    });
	
	console.log('Pushed data.');
    req.write(JSON.stringify(data), function(err){
    	req.end();
    });	
}