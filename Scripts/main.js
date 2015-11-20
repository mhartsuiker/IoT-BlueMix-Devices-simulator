// Represents one individual IoT device
var Device = function(id, broker, port, protocol, organisation, sensortype, deviceid, authmethod, authtoken, jsonformat, transmitInterval, temperature, state) {
    'use strict';
    
    var device = {};
       
    // Device parameters
    device.id = id,
    device.broker = broker,
    device.port = port,
    device.protocol = protocol,
    device.organisation = organisation,
    device.sensortype = sensortype;
    device.deviceid = deviceid,
    device.authmethod = authmethod,
    device.authtoken = authtoken,
    device.jsonformat = jsonformat,
    device.state = state,
    device.temperature = temperature,
    device.interval = transmitInterval,
    device.transmitting = null;
    
    device.createDevice = function(id) {
        var identifier = id + 1
        $('.devicesection').append("<div class='device'>" +
                                        "<div id='headersection'>" + 
                                            "IoT-device " + identifier +
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
            console.log('transmitting id = ' + device.id + ' temperature = ' + device.temperature);                
        }
        else {
           console.log('device turned off,  id = ' + device.id);              
        }  
    }
    
    var cancelTransmit = function() {
        clearInterval(device.transmitting);
    }

    device.updateDevice = function(id, temperature) {
        device.temperature = temperature;
        cancelTransmit();
        device.transmitting = setInterval(startTransmit, device.interval * 1000)        
    }
    
    device.startDevice = function() {
        device.transmitting = setInterval(startTransmit, device.interval * 1000)
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
    var deviceService = function(id, broker, port, protocol, organisation, sensortype, deviceid, authmethod, authtoken, jsonformat, 
            transmitInterval, temperature, state) {
        var device = Device(id, broker, port, protocol, organisation, sensortype, deviceid, authmethod, authtoken, jsonformat, transmitInterval,
            temperature, state);
        return device;
    };
    
    deviceService.prototype.startDevice = function(id) {
        services[id].startDevice();
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
            protocol = null,
            organisation = null,
            sensortype = null,
            deviceid = null,
            authmethod = null,
            authtoken = null,
            jsonformat = null,
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
            if (this.settings[i].name == 'protocol') {
                this.protocol = this.settings[i].value;
            }
            if (this.settings[i].name == 'organisation') {
                this.organisation = this.settings[i].value;
            }
            if (this.settings[i].name == 'sensortype') {
                this.sensortype = this.settings[i].value;
            }
            if (this.settings[i].name == 'deviceid') {
                this.deviceid = this.settings[i].value;              
            }
            if (this.settings[i].name == 'authmethod') {
                this.authmethod = this.settings[i].value;         
            }
            if (this.settings[i].name == 'authtoken') {
                this.authtoken = this.settings[i].value;       
            }                                    
            if (this.settings[i].name == 'jsonformat') {
                this.jsonformat = this.settings[i].value;          
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
        for(var i = 0; i < this.numberOfDevices; i++) {
          services.push(new deviceService(i, this.broker, this.port, this.protocol, this.organisation, this.sensortype, this.deviceid,
            this.authmethod, this.authtoken, this.jsonformat, this.transmitInterval, this.temperature, 'ON'));          
        }
        
        // Externally visible
        deviceController.prototype.start = function() {
            for(var i = 0; i < services.length; i++) {
                services[i].createDevice(i);
            }         
        }
        
        deviceController.prototype.updateDevice = function(id, temperature) {
            services[id].updateDevice(id, temperature);  
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


$(document).ready(function() {
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
        var data = JSON.parse(JSON.stringify(localStorage.getItem('iotdevicesimulation')));
        if (data !== null || data !== 'undefined') {
            $('#settingscheckbox').prop('checked', true);
        }
    }
}); 