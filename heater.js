defineAlias('Pump_1', 'wb-mr14_32/K2');
defineAlias('Pump_2', 'wb-mr14_32/K1');
defineAlias('Pump_Basement', 'wb-mr14_32/K3');
defineAlias('Pump_Boiler', 'wb-mr14_32/K4');
defineAlias('Boiler', 'wb-mr14_32/K8');

var heater_counter = 0;
var start_date = 0;

var TOUT_THRESHOULD = 30;
var TEMP_THRESHOULD = 24;
var HYSTERESIS_UP = 0;
var HYSTERESIS_DOWN = 0.1;

var GLOBALMAP = {
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
            value: false
        },
        'Work time': {
            type: 'text',
            value: ''
        },
        'Water heater': {
          	type: 'switch',
          	value: true
        }
    }
});

dev['thermostat']['Water heater'] = dev['wb-gpio']['D4_IN'];

defineRule('dl_w_heater_status', {
    whenChanged: ['wb-gpio/D4_IN'],
    then: function (newValue, devName, cellName) {
        dev['thermostat']['Water heater'] = newValue;
    }
});

defineRule('dl_w_heater', {
    whenChanged: ['thermostat/Water heater'],
    then: function (newValue, devName, cellName) {
		dev['wb-gpio/Relay_1'] = 1;
      	setTimeout(function() {
          dev['wb-gpio/Relay_1'] = 0;
        }, 1000);
    }
});

defineRule('dl_counter', {
    whenChanged: ['wb-mr14_32/K8'],
    then: function (newValue, devName, cellName) {
        if (newValue == 1) {
            start_date = Math.floor(Date.now() / 1000);
        } else {
            heater_counter += Math.floor(Date.now() / 1000) - start_date;
            start_date = 0;
        }
    }
});

defineRule("dl_cron", {
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

defineRule('dl_manage_pumps_by_temp', {
//  whenChanged: ['thermostat/Floor 1', 'thermostat/Floor 2', 'thermostat/Basement'], // debug
    whenChanged: ['thermostat/Floor 1 Temperature', 'thermostat/Floor 2 Temperature', 'thermostat/Basement Temperature'], // production
    then: function (newValue, devName, cellName) {
  
        if (!dev['thermostat']['Enabled']) {
            return;
        }

        if (dev['thermostat']['Simple']) {
            managePumpSimple();
        } else {
            var thermo = dev['thermostat'][GLOBALMAP[cellName]['thermo']]; // production
            managePumps(newValue, thermo, cellName);        
        }
    }
});

defineRule('dl_manage_pumps_by_thermo', {
    whenChanged: ['thermostat/Floor_1', 'thermostat/Floor_2', 'thermostat/Basement'],
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

defineRule('dl_set_temperature', {
    whenChanged: [
      'wb-w1/28-0014175e3eff',
      'wb-w1/28-00141743b2ff',
      'wb-w1/28-00141737fdff',
      'wb-w1/28-001416f342ff',
      'wb-w1/28-001417357bff',
      'wb-w1/28-001416e9e7ff',
      'wb-w1/28-0014175dd1ff'
    ],
    then: function (newValue, devName, cellName) {
        var map = {
            '28-0014175e3eff': 'Floor 1 Temperature',
            '28-00141743b2ff': 'Floor 2 Temperature',
            '28-00141737fdff': 'Basement Temperature',
            '28-001416f342ff': 'Garret Temperature',
            '28-001417357bff': 'Outside Temperature',
            '28-001416e9e7ff': 'Boiler Out Temperature',
            '28-0014175dd1ff': 'Bath House Temperature'          
        };
        dev.thermostat[map[cellName]] = newValue;
    }
});

defineRule('dl_set_pressure', {
    whenChanged: [
		'wb-adc/A2'
    ],
    then: function (newValue, devName, cellName) {
      	var coefficient = 0.8;
      	var shift = 0.5;
        dev.thermostat['Pressure'] = (coefficient * newValue + shift).toFixed(1);
    }
});

defineRule('dl_check_boiler_pump', {
    when: function() {
        return Boiler == 1 && Pump_Boiler == 0;
    },
    then: function (newValue, devName, cellName) {
        Pump_Boiler = 1;
    }
});


defineRule('dl_low_pressure', {
    whenChanged: 'thermostat/Pressure',
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }
		var low_threshould = 1;
      	if (newValue < low_threshould) {
			dev['thermostat']['Enabled'] = 0;
        }
    }
});

defineRule('dl_boiler_in_temperature', {
//  whenChanged: 'tout/temp', // debug
    whenChanged: 'thermostat/Boiler Out Temperature', // production
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }
        if ( Boiler == 0 && newValue < TOUT_THRESHOULD ) {
            Pump_1 = 0;
            Pump_2 = 0;      
            Pump_Basement = 0;      
            Pump_Boiler = 0;
        }
    }
});

defineRule("dl_heater_shutdown", {
  whenChanged: "thermostat/Enabled",
  then: function (newValue, devName, cellName) {
	if (newValue == false) {
      	switchBoiler(false);
      	Pump_1 = 0;
      	Pump_2 = 0;
        Pump_Basement = 0;
      	Pump_Boiler = 0;
    }
  }
});

function pumpsEnabled()
{
    var c = 0;

    if (Pump_1 == 1) {
        c++;
    }
    if (Pump_2 == 1) {
        c++;
    }
    if (Pump_Basement == 1) {
        c++;
    }
    return c;
}

function switchBoiler(enable)
{
    if (enable && Boiler == 0) {
        Boiler = 1;
        Pump_Boiler = 1;
    } else if (!enable && Boiler == 1) {
        Boiler = 0;    
    }
}

function pumpValueByTemp(cellName, value)
{
    var relay = GLOBALMAP[cellName]['relay'];

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

