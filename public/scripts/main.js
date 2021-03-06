// Represents one individual IoT device
var Device = function(id, broker, port, organisation, sensortype, deviceid, authmethod, authtoken, transmitInterval, temperature, state) {
    'use strict';
    
    var device = {};
       
    // Device parameters
    device.id = id,
    device.broker = broker,
    device.port = port,
    device.organisation = organisation,
    device.sensortype = sensortype,
    device.deviceid = deviceid,
    device.authmethod = authmethod,
    device.authtoken = authtoken,
    device.state = state,
    device.temperature = temperature,
    device.interval = transmitInterval,
    device.transmitting = null; 
    var client = null;
    
    var constants = {
        'MQTT': {
            'AUTHMETHOD': 'use-token-auth',
            'TOPIC': 'iot-2/evt/status/fmt/json'
        }
    }
    
    device.createDevice = function() {
        $('.devicesection').append("<div class='device'>" +
                                        "<div id='headersection'>" + 
                                            "IoT-device " + device.id +
                                        "</div>" +
                                        "<div class='devicecontent' data-id="+ device.id +">" +
                                            "<span class='devicestatus'>" +
                                                "<div class='statusbuttonon' title='click to change the status of the device'></div>" +                                            
                                                "<label class='devicelabel' for='status'>device status</label>" + 
                                            "</span>" +
                                            "<span class='devicebutton'>" + 
                                                "<label class='devicelabel' for='temperature'>temperature</label>" +
                                                "<input class='deviceinput' id='temperature' type='number' pattern='[0-9]*' name='temperature' value=" + device.temperature + ">" +
                                                "<input class='settemperature' type='button' name='settemperature' value='Set temperature'>" +
                                            "</span>" +
                                        "</div>" +
                                    "</div>");   
        device.startDevice();
    }    
       
    var startTransmit = function() {        
        if (device.state == 'ON') {             
            try {             
                var msg = '{"d": {"id": "' + device.deviceid + device.id + '", "lat": "0" , "lng":"0", "temp": "' + device.temperature + '"}}'; 
                console.log('Message = ' + msg);                   
                var message = new Paho.MQTT.Message(JSON.stringify(msg));
                message.destinationName = 'iot-2/evt/status/fmt/json';  
                message.qos = 0;           
                client.send(message);    
            }
            catch (e) {
                console.log('startTransmit exception thrown: ' + e.message);              
            }
        }
        else {
           console.log('device turned off,  id = ' + device.id);              
        }  
    }
    
    var onSuccess = function () {              
        // client.subscribe('iot-2/evt/status/fmt/json');
        console.log('Subscribed to topic: ' + 'iot-2/evt/status/fmt/json');                               
        console.log('Successfully connected to the IoT broker');                    
        device.transmitting = setInterval(startTransmit, device.interval * 1000)                       
    }
    
    var onFailure = function(msg) {
        console.log('Error connecting to IBM IoT: ' + JSON.stringify(msg));
    }
    
    var onConnectionLost = function(msg) {
        if (msg.errorCode !== 0) {
            console.log('Connection lost erorr message: ' + msg.errorMessage);
        }
    }
    
    var onMessageArrived = function(message) {
        console.log('Message arrived: ' + message.payloadString);
    }    
    
    var cancelTransmit = function() {
        clearInterval(device.transmitting);
    }

    device.updateDevice = function(id, temperature) {
        cancelTransmit();    	
        device.temperature = temperature;
        device.transmitting = setInterval(startTransmit, device.interval * 1000)        
    }
    
    device.startDevice = function() {
        var deviceIdentifier = device.deviceid + device.id;
        var clientid = 'd:' + organisation + ':' + sensortype + ':' + deviceIdentifier;     
        var brokerurl = organisation + '.' + broker;
        var portNumber = parseInt(port);
        
        try {
            if (!isNaN(portNumber)) {
                console.log('SetupMQTTCllient, broker = ' + brokerurl + ' port = ' + portNumber + ' clientid = ' + clientid);                  
                
                var options = {
                    timeout: 30, // Connection attempt timeout in seconds
                    userName: device.authmethod,
                    password: device.authtoken,
                    keepAliveInterval: 60,
                    onSuccess: onSuccess,           
                    onFailure: onFailure
                };
                
                if (portNumber === 8883) {
                    options.useSSL = true;
                }
                
                client = new Paho.MQTT.Client(brokerurl, portNumber, clientid);  
                client.onConnectionLost = onConnectionLost;
                client.OnMessageArrived = onMessageArrived;     
                client.connect(options);
            }
            else {
                console.log('Error parsing port number');
            }
        }
        catch (e) {
            console.log('startDevice exception thrown: ' + e.message);
        }
    }

    device.stopDevice = function() {
    	cancelTransmit();
    	client.disconnect();
    	console.log('Çlient disconnected with id: ' + device.id);
    }
    
    device.changeDeviceState = function(state) {
        if (state == 'OFF') {
            device.state = 'OFF';
            cancelTransmit();    
        }
        else {   
            device.state = 'ON';              
        }   
    }
    
    device.getDetails = function() {
        console.log(device);
    }
    
    return device;
}

// Module to keep all the functionality in one location
var deviceModule = (function() {
    'use strict';
    
    var settings = {};
    var services = [];
    
    var deviceState = {
        'ON': 'ON',
        'OFF': 'OFF'
    };
     
    // Each device has it's own service that controls everything the device can do
    var deviceService = function(id, broker, port, organisation, sensortype, deviceid, authmethod, authtoken, transmitInterval, temperature, state) {
        var device = Device(id, broker, port, organisation, sensortype, deviceid, authmethod, authtoken, transmitInterval, temperature, state);
        return device;
    };
    
    deviceService.prototype.startDevice = function(id) {
        services[id].startDevice();
    }
 
    deviceService.prototype.stopDevice = function(id) {
    	services[id].stopDevice();
    }
    
    deviceService.prototype.updateDevice = function(id, state) {
        services[id].updateDevice(id, state);
    }
    
    deviceService.prototype.changeDeviceState = function(id, state) {
        services[id].changeDeviceState(state);
    }
    
    // Create a new controller, the controller will create a new service 
    // for the total number of devices requested
    // The controller talks to the front-end
    var deviceController = function(data) {
        
        // Only internally visible
        this.settings = JSON.parse(data);
               
        var broker = null,
            port = null,
            organisation = null,
            sensortype = null,
            deviceid = null,
            authmethod = null,
            authtoken = null,
            numberOfDevices = null,
            temperature = null,
            transmitInterval = null;
        
        for(var i = 0; i < this.settings.length; i++) {
            var d = this.settings[i];            
                                  
            if (this.settings[i].name == 'broker') {
                this.broker = this.settings[i].value;                
            }
            if (this.settings[i].name == 'port') {
                this.port = this.settings[i].value;          
            }
            if (this.settings[i].name == 'organisation') {
                this.organisation = this.settings[i].value;
            }
            if (this.settings[i].name == 'sensortype') {
                this.sensortype = this.settings[i].value;
            }
            if (this.settings[i].name == 'deviceid') {
                var tempid = this.settings[i].value.substring(0, this.settings[i].value.length - 1);
                this.deviceid = tempid;              
            }
            if (this.settings[i].name == 'authmethod') {
                this.authmethod = this.settings[i].value;         
            }
            if (this.settings[i].name == 'authtoken') {
                this.authtoken = this.settings[i].value;       
            }                                    
            if (this.settings[i].name == 'temperature') {
                this.temperature = this.settings[i].value;         
            }                        
            if (this.settings[i].name == 'numberOfDevices') {
                this.numberOfDevices = this.settings[i].value;         
            }     
            if (this.settings[i].name == 'transmitinterval') {
                this.transmitInterval = this.settings[i].value;         
            }                    
        }
        
        services = [];
        
        // Create a new service for the requested number of devices. 'i' will serve as the service id. 
        // Push the new servivce into the services array
        for(var i = 1; i <= this.numberOfDevices; i++) {
          services.push(new deviceService(i, this.broker, this.port, this.organisation, this.sensortype, this.deviceid,
            this.authmethod, this.authtoken, this.transmitInterval, this.temperature, 'ON'));          
        }
        
        // Externally visible
        deviceController.prototype.start = function() {
            for(var i = 0; i < services.length; i++) {
                services[i].createDevice(i);
            }         
        }
        
		deviceController.prototype.stopDevices = function() {
            for(var i = 0; i < services.length; i++) {
                services[i].stopDevice(i);
            } 			
		}

        deviceController.prototype.updateDevice = function(id, temperature) {
        	var s = services;
            services[id - 1].updateDevice(id - 1, temperature);  
        }     
        
        deviceController.prototype.changeDeviceState = function(id, state) {           
            services[id].changeDeviceState(state);  
        }  
    };
           
    return {
        createService : function() {
            return new deviceService();
            
        },
        createController : function(data) {
            return new deviceController(data);
        }
    }   
    
})();

$(function() {
    'use strict';
          
    var deviceController = null;
       
    $('#startbutton').on('click', function() {
        var data = JSON.stringify($('#settingsform').serializeArray());
        
        // Clear previous devices 
        $('.devicesection').empty();
        
        // Store form data in LocalStorage if the Save settings checkbox is checked
        if (typeof(Storage) !== 'undefined') {
            if ($('#settingscheckbox').prop('checked') == true) {
                    var data = JSON.stringify($('#settingsform').serializeArray());
                    localStorage.setItem('iotdevicesimulation', data);   
                    $('#log').append('<p>Settings stored</p>'); 
            }
            else {
                if (localStorage['iotdevicesimulation']) {
                    localStorage.removeItem('iotdevicesimulation');                    
                }
            }           
        }
        else {
            $('#errormessages').empty();
            $('#errormessages').append('<p>Local storage is not available. Please use a HTML5 compatible browser.</p>');
            $('#errormessages').toggle();
        }          
        
        // Create a new controller with the provided data
        deviceController = deviceModule.createController(data);
        deviceController.start();
        
    });

	$('#stopdevicesbutton').on('click', function() {
		if (deviceController !== null && deviceController !== 'undefined') {
			deviceController.stopDevices();
        	$('.devicesection').empty();			
		}
	})

	$('#showlog').on('click', function() {
		$('#log').toggle();
	})
    
    $('.devicesection').on('click', '.settemperature', function(e) {
        var that = this;
        var id = that.parentElement.parentNode.getAttribute('data-id');      
        var temperature = that.parentElement.children[1].value;
        deviceController.updateDevice(id, temperature);
    });
    
    $('.devicesection').on('click', '.statusbuttonon', function(e) {
        var that = this;
        var id = that.parentElement.parentNode.getAttribute('data-id');      
        var currentChild = that.parentElement.children[0];    
        currentChild.className = 'statusbuttonoff';
        deviceController.changeDeviceState(id, 'OFF');
    });    
    
    $('.devicesection').on('click', '.statusbuttonoff', function(e) {
        var that = this;
        var id = that.parentElement.parentNode.getAttribute('data-id');      
        var currentChild = that.parentElement.children[0];
        currentChild.className = 'statusbuttonon';
        deviceController.changeDeviceState(id, 'ON');
    });  
    
    // If form data is stored in LocalStorage retrieve it and fill the form with the data    
    if (typeof(Storage) !== "undefined") {
        var data = JSON.parse(localStorage.getItem('iotdevicesimulation'));
        if (data !== null && data !== 'undefined') {
            $('#settingscheckbox').prop('checked', true);
                   
            for(var i = 0; i < data.length; i++) {          
                if (data[i].name == 'broker') {
                    $('#broker').val(data[i].value);                
                }
                if (data[i].name == 'port') {
                    $('#portnumber').val(data[i].value);          
                }
                if (data[i].name == 'organisation') {
                    $('#organisation').val(data[i].value);
                }
                if (data[i].name == 'sensortype') {
                    $('#sensortype').val(data[i].value);
                }
                if (data[i].name == 'deviceid') {
                    $('#deviceid').val(data[i].value);          
                }
                if (data[i].name == 'authmethod') {
                    $('#authmethod').val(data[i].value);         
                }
                if (data[i].name == 'authtoken') {
                    $('#authtoken').val(data[i].value);       
                }                                     
                if (data[i].name == 'temperature') {
                    $('#temperature').val(data[i].value);         
                }                        
                if (data[i].name == 'numberOfDevices') {
                    $('#numberOfDevices').val(data[i].value);         
                }     
                if (data[i].name == 'transmitinterval') {
                    $('#transmitinterval').val(data[i].value);         
                }  
            }           
        }
    }
}); 
