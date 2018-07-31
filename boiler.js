var relays = {
    'pump1': 'wb-mr14_32/K2',
    'pump2': 'wb-mr14_32/K1',
    'pumpBasement': 'wb-mr14_32/K3',
    'pumpBoiler': 'wb-mr14_32/K4',
    'boiler': 'wb-mr14_32/K8',
}

var sensors = {
    'floor1': 'wb-w1/28-0014175e3eff',
    'floor2': 'wb-w1/28-00141743b2ff',
    'basement': 'wb-w1/28-00141737fdff',
    'garret': 'wb-w1/28-001416f342ff',
    'outside': 'wb-w1/28-001417357bff',
    'boiler': 'wb-w1/28-001416e9e7ff',
    'bathhouse': 'wb-w1/28-0014175dd1ff',
    'pressure': 'wb-adc/A2'
};

var devicesByTemperature = {
    'Floor 1 Temperature': {
        relay: 'K2',
        thermo: 'Floor_1'
    },
    'Floor 2 Temperature': {
        relay: 'K1',
        thermo: 'Floor_2'
    },
    'Basement Temperature': {
        relay: 'K3',
        thermo: 'Basement'
    }
};

defineAlias('pump1', relays.pump1);
defineAlias('pump2', relays.pump2);
defineAlias('pumpBasement', relays.pumpBasement);
defineAlias('pumpBoiler', relays.pumpBoiler);
defineAlias('boiler', relays.boiler);

var heater_counter = 0;
var start_date = 0;

var TOUT_THRESHOULD = 30;
var TEMP_THRESHOULD = 24;
var HYSTERESIS_UP = 0;
var HYSTERESIS_DOWN = 0.1;


defineVirtualDevice('thermostat', {
    title: 'Thermostat', //
    cells: {
        'Floor_1' : {
            type : 'range',
            value : 24,
            max : 30
        },
        'Floor 1 Temperature': {
            type: 'temperature',
            value: ''
        },
        'Floor_2' : {
            type : 'range',
            value : 23,
            max : 30,
        },
        'Floor 2 Temperature': {
            type: 'temperature',
            value: ''
        },
        'Basement' : {
            type : 'range',
            value : 24,
            max : 30,
        },
        'Basement Temperature': {
            type: 'temperature',
            value: ''
        },
        'Garret Temperature': {
            type: 'temperature',
            value: ''
        },
        'Outside Temperature': {
            type: 'temperature',
            value: ''
        },
        'Boiler Out Temperature': {
            type: 'temperature',
            value: ''
        },
        'Bath House Temperature': {
            type: 'temperature',
            value: ''
        },      
        'Pressure': {
            type: 'text',
            value: ''
        },      
        'Enabled': {
            type: 'switch',
            value: true
        },
        'Simple': {
            type: 'switch',
            value: true
        },
        'Work time': {
            type: 'text',
            value: '0'
        }
    }
});

defineRule('th.counter', {
    whenChanged: [relays.boiler],
    then: function (newValue, devName, cellName) {
        if (newValue == 1) {
            start_date = Math.floor(Date.now() / 1000);
        } else {
            heater_counter += Math.floor(Date.now() / 1000) - start_date;
            start_date = 0;
        }
    }
});

defineRule("th.counterSummary", {
    when: cron("@midnight"),
    then: function () {
        if (start_date != 0) {
            heater_counter += Math.floor(Date.now() / 1000) - start_date;
            start_date = Math.floor(Date.now() / 1000);
        }
        dev['thermostat']['Work time'] = heater_counter;
        heater_counter = 0;
    }
});

defineRule('th.switchPumpsByTemperature', {
    whenChanged: [
        'thermostat/Floor 1 Temperature', 
        'thermostat/Floor 2 Temperature', 
        'thermostat/Basement Temperature'
    ],
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }
        if (dev['thermostat']['Simple']) {
            managePumpSimple();
        } else {
            var thermo = dev['thermostat'][devicesByTemperature[cellName]['thermo']]; // production
            managePumps(newValue, thermo, cellName);        
        }
    }
});

defineRule('th.switchPumpsByThermostat', {
    whenChanged: [
        'thermostat/Floor_1', 
        'thermostat/Floor_2', 
        'thermostat/Basement'
    ],
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }
        var map = {
            'Floor_1': 'Floor 1 Temperature',
            'Floor_2': 'Floor 2 Temperature',
            'Basement': 'Basement Temperature'
        };

        if (dev['thermostat']['Simple']) {        
            if (cellName == 'Floor_1') {
                managePumpSimple();
            }            
        } else {
            var temp = dev['thermostat'][map[cellName]];
            managePumps(temp, newValue, map[cellName]);
        }
    }
});

defineRule('th.displayTemperature', {
    whenChanged: [
      sensors.floor1,
      sensors.floor2,
      sensors.basement,
      sensors.boiler,
      sensors.garret,
      sensors.outside,
      sensors.bathhouse
    ],
    then: function (newValue, devName, cellName) {
        var map = {}
        map[sensors.floor1] = 'Floor 1 Temperature';
        map[sensors.floor2] = 'Floor 2 Temperature';
        map[sensors.basement] = 'Basement Temperature';
        map[sensors.garret] = 'Garret Temperature';
        map[sensors.outside] = 'Outside Temperature';
        map[sensors.boiler] = 'Boiler Out Temperature';
        map[sensors.bathhouse] = 'Bath House Temperature';
        
        dev.thermostat[map[devName + '/' + cellName]] = newValue;
    }
});

defineRule('th.displayPressure', {
    whenChanged: [sensors.pressure],
    then: function (newValue, devName, cellName) {
      	var coefficient = 1.30459;
        var shift = -0.500871;
        var pressure = (coefficient * newValue + shift).toFixed(1);
        if (pressure != dev.thermostat['Pressure']) {
            dev.thermostat['Pressure'] = pressure;
        }
    }
});

defineRule('th.checkPressure', {
    whenChanged: [
        'thermostat/Pressure'
    ],
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }		      
        var lowThreshould = 1;
        if (newValue < lowThreshould) {
            dev['thermostat']['Enabled'] = 0;
        }
    }
});

defineRule('th.checkBoilerPump', {
    when: function() {
        return boiler == 1 && pumpBoiler == 0;
    },
    then: function (newValue, devName, cellName) {
        pumpBoiler = 1;
    }
});


defineRule('th.checkBoilerTemperature', {
    whenChanged: [
        'thermostat/Boiler Out Temperature'
    ],
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }        
        if (boiler == 0 && newValue < TOUT_THRESHOULD) {
            pump1 = 0;
            pump2 = 0;      
            pumpBasement = 0;      
            pumpBoiler = 0;
        }
    }
});

defineRule("th.shutdownBoiler", {
    whenChanged: "thermostat/Enabled",
    then: function (newValue, devName, cellName) {
        if (newValue == false) {
            switchBoiler(false);
            pump1 = 0;
            pump2 = 0;
            pumpBasement = 0;
            pumpBoiler = 0;
        }
    }
});

function pumpsEnabled()
{
    var c = 0;

    if (pump1 == 1) {
        c++;
    }
    if (pump2 == 1) {
        c++;
    }
    if (pumpBasement == 1) {
        c++;
    }
    return c;
}

function switchBoiler(enable)
{
    if (enable && boiler == 0) {
        boiler = 1;
        pumpBoiler = 1;
    } else if (!enable && boiler == 1) {
        boiler = 0;
    }
}

function pumpValueByTemp(cellName, value)
{
    var relay = devicesByTemperature[cellName]['relay'];

    if (value === undefined) {
        return dev['wb-mr14_32'][relay];
    } else {
        dev['wb-mr14_32'][relay] = value;
    }
}

function managePumps(temp, thermo, tempCell)
{    
    if (temp < thermo - HYSTERESIS_DOWN) {
        pumpValueByTemp(tempCell, 1);
        switchBoiler(true);
    } else if (temp > thermo + HYSTERESIS_UP && pumpValueByTemp(tempCell) == 1) {
        if (pumpsEnabled() == 1) {
            switchBoiler(false);
        } else {
            pumpValueByTemp(tempCell, 0);
        }
    }
}

function managePumpSimple()
{
    var tempCell = 'Floor 1 Temperature';
    var temp = dev['thermostat'][tempCell];
    var thermo = dev['thermostat']['Floor_1'];
    
    if (temp < thermo - HYSTERESIS_DOWN && pumpValueByTemp(tempCell) == 0) {
        pumpValueByTemp(tempCell, 1);
        pumpValueByTemp('Floor 2 Temperature', 1);
        pumpValueByTemp('Basement Temperature', 1);
        switchBoiler(true);
    } else if (temp > thermo + HYSTERESIS_UP && pumpValueByTemp(tempCell) == 1) {
        switchBoiler(false);
    }  
}
