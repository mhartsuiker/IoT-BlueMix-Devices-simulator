

var deviceModule = (function() {
    
    var settings = {};
    var services = [];
    
    // Each device has it's own service that controls everythign the device can do
    var deviceService = function(id, broker, port, protocol, organisation, sensortype, deviceid, authmethod, authtoken, jsonformat) {
        var id = id,
            broker = broker,
            port = port,
            protocol = protocol,
            organisation = organisation,
            sensortype = sensortype;
            deviceid = deviceid,
            authmethod = authmethod,
            authtoken = authtoken,
            jsonformat = jsonformat;     
    };
    
    deviceService.prototype.createDevice = function(id) {
        console.log('createdevice called');
        var identifier = id + 1
        $('.devicesection').append("<div class='device'>" +
                                        "<div id='headersection'>" + 
                                            "Device " + identifier +
                                        "</div>" +
                                        "<div class='devicecontent' data-id="+ id +">" +
                                            "test<br />" +
                                            "<label class='settingslabel' for='transmitinterval'>Transmit interval in seconds</label>" +
                                            "<input class='settingsinput' type='number' pattern='[0-9]*' name='transmitinterval' value='10'><br /><br />" +
                                        "</div>" +
                                    "</div>");        
    }    
    
    // Create a new controller, the controller will create a new service 
    // for the total number of devices requested
    var deviceController = function(data) {
        this.settings = JSON.parse(data);
               
        var broker = null,
            port = null,
            protocol = null,
            organisation = null,
            sensortype = null;
            deviceid = null,
            authmethod = null,
            authtoken = null,
            jsonformat = null,
            numberOfDevices = null;
        
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
            if (this.settings[i].name == 'numberOfDevices') {
                this.numberOfDevices = this.settings[i].value;         
            }           
        }
        
        services = [];
        
        // Create a new service for the requested number of devices. 'i' will serve as the service id. 
        // Push the new servivce into the services array
        for(var i = 0; i < this.numberOfDevices; i++) {
          services.push(new deviceService(i + 1, this.broker, this.port, this.protocol, this.organisation, this.sensortype, this.deviceid,
                                 this.authmethod, this.authtoken, this.jsonformat));          
        }
        
        deviceController.prototype.start = function() {
            for(var i = 0; i < services.length; i++) {
                console.log('inside start function');
                services[i].createDevice(i);
            }
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
    
    // If form data is stored in LocalStorage retrieve it and fill the form with the data    
    if (typeof(Storage) !== "undefined") {
        var data = JSON.parse(JSON.stringify(localStorage.getItem('iotdevicesimulation')));
        if (data !== null || data !== 'undefined') {
            $('#settingscheckbox').prop('checked', true);
        }
    }
}); 
