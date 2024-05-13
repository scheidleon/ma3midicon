//MA3 MIDICON control code beta 0.3 by ArtGateOne
var easymidi = require('easymidi');
var osc = require("osc");
var W3CWebSocket = require('websocket')
    .w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:8080/'); //U can change localhost(127.0.0.1) to Your console IP address

//config
midi_in = 'MIDIcon 2';     //set correct midi in device name
midi_out = 'MIDIcon 2';  
localip = "127.0.0.1";
localport = 8020;
remoteip = "127.0.0.1";
remoteport = 8000;


//var faderValue = [0, 0, 0, 0, 0.2, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2, 4.6, 5, 5.3, 5.7, 6.1, 6.5, 6.9, 7.3, 7.7, 8.1, 8.5, 8.9, 9.3, 9.7, 10, 10.4, 10.8, 11.2, 11.6, 12, 12.4, 12.8, 13.2, 13.6, 14, 14.15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 100, 100];
var faderValue = [0, 0, 0.8, 1.6, 2.4, 3.2, 4, 4.8, 5.6, 6.4, 7.2, 8, 8.8, 9.6, 10.4, 11.2, 12, 12.8, 13.6, 14.4, 15.2, 16, 16.8, 17.6, 18.4, 19.2, 20, 20.8, 21.6, 22.4, 23.2, 24, 24.8, 25.6, 26.4, 27.2, 28, 28.8, 29.6, 30.4, 31.2, 32, 32.8, 33.6, 34.4, 35.2, 36, 36.8, 37.6, 38.4, 39.2, 40, 40.8, 41.6, 42.4, 43.2, 44, 44.8, 45.6, 46.4, 47.2, 48, 48.8, 49.6, 50.4, 51.2, 52, 52.8, 53.6, 54.4, 55.2, 56, 56.8, 57.6, 58.4, 59.2, 60, 60.8, 61.6, 62.4, 63.2, 64, 64.8, 65.6, 66.4, 67.2, 68, 68.8, 69.6, 70.4, 71.2, 72, 72.8, 73.6, 74.4, 75.2, 76, 76.8, 77.6, 78.4, 79.2, 80, 80.8, 81.6, 82.4, 83.2, 84, 84.8, 85.6, 86.4, 87.2, 88, 88.8, 89.6, 90.4, 91.2, 92, 92.8, 93.6, 94.4, 95.2, 96, 96.8, 97.6, 98.4, 99.2, 100, 100];
var encoderState = [100, 100, 100, 100, 100, 100, 100, 100];
var str = "string";
var grandmaster = 100;
var grandmasterfader = 127;
var BO = 0; //Black Out 0 -off
var keypressed = 0;
var matrixpage = 1;
var playbackpage = 1;

// Create an osc.js UDP Port listening on port 8000.
var udpPort = new osc.UDPPort({
    localAddress: localip,
    localPort: localport,
    metadata: true
});

// Open the socket.
udpPort.open();

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

//Setup Page
output.send('cc', {
    controller: 10,
    value: playbackpage,
    channel: 0
  })

  output.send('cc', {
    controller: 11,
    value: matrixpage,
    channel: 0
  })

 udpPort.send({
    address: "/cmd",
    args: [
        {
            type: "s",
            value: "Page " + matrixpage
        }
    ]
}, remoteip, remoteport);


input.on('cc', function (msg) {

    if (msg.controller <= 8) {//faders 1-8
        //create address string      
        str = "/Page" + (playbackpage) + "/Fader" + (msg.controller + 200);

        //send OSC
        udpPort.send({
            address: str,
            args: [
                {
                    type: "i",
                    value: (faderValue[msg.value])
                }
            ]
        }, remoteip, remoteport);
    }
    else if (msg.controller == 9) {//GrandMaster

        grandmaster = faderValue[msg.value];
        grandmasterfader = msg.value;       

        if (BO == 0) {

            output.send('noteon', {
                note: 114,
                velocity: 127 - grandmasterfader,
                channel: 0
              });

            udpPort.send({
                address: "/cmd",
                args: [
                    {
                        type: "s",
                        value: "Master 2.1 At " + grandmaster
                    }
                ]
            }, remoteip, remoteport);
        } 
    }
});


input.on('noteon', function (msg) {
    if (msg.velocity == 127) {
        keypressed = 1;
    } else {
        keypressed = 0;
    }
    //console.log(msg);

    if (msg.note >= 1 && msg.note <= 8) {//1-8 buttons (wing2 416-423)
        console.log('KEY ' + (msg.note + 415));
        udpPort.send({
            address: "/Page" + (matrixpage) + "/Key" + (msg.note + 415),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note >= 9 && msg.note <= 16) {//9-16 buttons (wing2 316-323)
        console.log('KEY ' + (msg.note + 307));
        udpPort.send({
            address: "/Page" + (matrixpage) + "/Key" + (msg.note + 307),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note >= 17 && msg.note <= 24) {//17-24 buttons (wing2 216-223)
        console.log('KEY ' + (msg.note + 199));
        udpPort.send({
            address: "/Page" + (matrixpage) + "/Key" + (msg.note + 199),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note >= 25 && msg.note <= 32) {//25-32 buttons (wing2 116-123)
        console.log('KEY ' + (msg.note + 91));
        udpPort.send({
            address: "/Page" + (matrixpage) + "/Key" + (msg.note + 91),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note >= 33 && msg.note <= 40) {//A-H Keys (Xkeys 191-198)
        console.log('XKEY ' + (msg.note + 158));
        udpPort.send({
            address: "/Page" + (matrixpage) + "/Key" + (msg.note + 158),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }
    
    else if (msg.note >= 41 && msg.note <= 48) {//Upper Playback (201-208)
        console.log('KEY 20' + (msg.note - 40));
        udpPort.send({
            address: "/Page" + (playbackpage) + "/Key20"+(msg.note-40),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note >= 49 && msg.note <= 56) {//Lower Playback (101-108)
        console.log('KEY 10' + (msg.note - 48));
        udpPort.send({
            address: "/Page" + (playbackpage) + "/Key10"+(msg.note-48),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note == 57 && msg.velocity == 127) {//Playback PageUP
        console.log('Playback PageUp');
        playbackpage = playbackpage + 1;
        if (playbackpage > 5) {
            playbackpage = 5;
        }
        output.send('cc', {
            controller: 10,
            value: playbackpage,
            channel: 0
          })
    }

    else if (msg.note == 58 && msg.velocity == 127) {//Playback PageDOWN
        console.log('Playback PageDown');
        playbackpage = playbackpage - 1;
        if (playbackpage < 1) {
            playbackpage = 1;
        }
        output.send('cc', {
            controller: 10,
            value: playbackpage,
            channel: 0
          })
    }

    else if (msg.note >= 59 && msg.note <= 64 && msg.velocity == 127) {//Select EncoderPage S buttons
        console.log('S'+(msg.note-58));
        udpPort.send({
            address: "/cmd",
            args: [
                {
                    type: "s",
                    value: "Select FeatureGroup " + (msg.note - 58)
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note == 65 && msg.velocity == 127) {//Matrix PageUP
        console.log('Matrix PageUp');
        matrixpage = matrixpage + 1;
        if (matrixpage > 5) {
            matrixpage = 5
        }
        udpPort.send({
            address: "/cmd",
            args: [
                {
                    type: "s",
                    value: "Page " + matrixpage
                }
            ]
        }, remoteip, remoteport);
        output.send('cc', {
            controller: 11,
            value: matrixpage,
            channel: 0
          })
    }

    else if (msg.note == 66 && msg.velocity == 127) {//Matrix PageDOWN
        console.log('Matrix PageDown');
        matrixpage = matrixpage - 1;
        if (matrixpage < 1) {
            matrixpage = 1
        }
        udpPort.send({
            address: "/cmd",
            args: [
                {
                    type: "s",
                    value: "Page " + matrixpage
                }
            ]
        }, remoteip, remoteport);
        output.send('cc', {
            controller: 11,
            value: matrixpage,
            channel: 0
          })
    }

    else if (msg.note == 67) {//BO
        console.log('BO')
        if (msg.velocity == 127) {
            BO = 1;
            udpPort.send({
                address: "/cmd",
                args: [
                    {
                        type: "s",
                        value: "Master 2.1 At 0"
                    }
                ]
            }, remoteip, remoteport);
            output.send('noteon', {
                note: 114,
                velocity: 127,
                channel: 0
              });
        } else {
            BO = 0;
            udpPort.send({
                address: "/cmd",
                args: [
                    {
                        type: "s",
                        value: "Master 2.1 At " + grandmaster
                    }
                ]
            }, remoteip, remoteport);
            output.send('noteon', {
                note: 114,
                velocity: 127 - grandmasterfader,
                channel: 0
              });
        }

    }

    else if (msg.note >= 68 && msg.note <= 75) {//Playback Encoder (101-108)
        console.log('KEY 30' + (msg.note - 67));
        udpPort.send({
            address: "/Page" + (playbackpage) + "/Key30"+(msg.note-67),
            args: [
                {
                    type: "i",
                    value: keypressed
                }
            ]
        }, remoteip, remoteport);
    }

    else if (msg.note == 78) {//Encoder 1
        console.log('Encoder 1 U');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":204,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note == 79) {//Encoder 1
        console.log('Encoder 1 D');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":204,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":-1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note == 80) {//Encoder 2
        console.log('Encoder 2 U');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":577,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note == 81) {//Encoder 2
        console.log('Encoder 2 D');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":577,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":-1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note == 82) {//Encoder 3
        console.log('Encoder 3 U');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":946,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note == 83) {//Encoder 3
        console.log('Encoder 3 D');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":946,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":-1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }
    else if (msg.note == 84){//Encoder 4
        console.log('Encoder 4 U');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":1315,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }
    else if (msg.note == 85){//Encoder 4
        console.log('Encoder 4 D');
        client.send('{"requestType":"nextFrame"}');
        client.send('{"requestType":"mouseEvent","posX":1315,"posY":995,"eventType":"wheel","deltaX":1,"deltaY":-1,"deltaZ":0,"deltaMode":0,"ctrlKey":false}');
    }

    else if (msg.note >= 86 && msg.note <= 101) {//Encoders 301-308
        encodernumber = Math.ceil((msg.note - 85) / 2);
        if(msg.note % 2 == 0) {
            //EncoderUP
            encoderState[encodernumber - 1] = encoderState[encodernumber - 1] + 1;
            if (encoderState[encodernumber -1] > 100) {
                encoderState[encodernumber -1] = 100;
            }
            console.log("Encoder" + encodernumber + " Up " + encoderState[encodernumber - 1])
        } else {
            //EncoderDown
            encoderState[encodernumber - 1] = encoderState[encodernumber - 1] - 1;
            if (encoderState[encodernumber -1] < 0) {
                encoderState[encodernumber -1] = 0;
            }
            console.log("Encoder" + encodernumber + " Down " + encoderState[encodernumber - 1])
        }

        //create address string      
        str = "/Page" + (playbackpage) + "/Fader" + (encodernumber + 300);
        console.log(str);
        console.log(encoderState[encodernumber-1]);

        //send OSC
        udpPort.send({
            address: str,
            args: [
                {
                    type: "i",
                    value: (encoderState[encodernumber-1])
                }
            ]
        }, remoteip, remoteport);
    }
});

console.log("Connecting to MA3PC ...");
//WEBSOCKET-------------------
client.onerror = function () {
    console.log('Connection Error');
};

client.onopen = function () {
    console.log('WebSocket Client Connected');

    function sendNumber() {
        if (client.readyState === client.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            client.send(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    //sendNumber();
};

client.onclose = function () {
    console.log('Client Closed');
    input.close();
    //output.close();
    process.exit();
};

client.onmessage = function (e) {

    if (typeof e.data == 'string') {
        //console.log("Received: '" + e.data + "'");
        //console.log(e.data);


        obj = JSON.parse(e.data);
        //console.log(obj);

        if (obj.status == "server ready") {
            console.log("SERVER READY");
            client.send('{"requestType":"remoteState"}')
        }

        if (obj.type == "remoteState") {
            console.log("Remote State");
            client.send('{"requestType":"resizeVideo","width":2048,"height":1056}');
            client.send('{"requestType":"requestVideo"}');
        }

        if (obj.MA == "00") {
            console.log(obj);
            client.send('{"requestType":"nextFrame"}');
        }

    }
}