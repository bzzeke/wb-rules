var relays = {
    'pump1': 'relays/K1',
    'pump2': 'relays/K2',
    'pumpBasement': 'relays/K3',
    'boiler': 'relays/K8',
}

var sensors = {
    'floor1': 'sensor_1/Temperature',
    'floor2': 'sensor_2/Temperature',
    'basement': 'sensor_0/Temperature',
    'boiler': 'boiler/Current Temperature',
    'boiler_pump': 'boiler/Pump',
    'pressure': 'wb-adc/A1',
    'vcc': 'wb-adc/5Vout'
};

var devicesByTemperature = {};

devicesByTemperature[sensors.floor1] = {
    relay: 'K1',
    thermo: 'Floor_1'
};
devicesByTemperature[sensors.floor2] = {
    relay: 'K2',
    thermo: 'Floor_2'
};
devicesByTemperature[sensors.basement] = {
    relay: 'K3',
    thermo: 'Basement'
};

defineAlias('pump1', relays.pump1);
defineAlias('pump2', relays.pump2);
defineAlias('pumpBasement', relays.pumpBasement);
defineAlias('boiler', relays.boiler);

var heater_counter = 0;
var start_date = 0;

var HYSTERESIS_UP = 0;
var HYSTERESIS_DOWN = 0.1;
var PRESSURE_LOW_THRESHOULD = 0.2;


defineVirtualDevice('thermostat', {
    title: 'Thermostat', //
    cells: {
        'Floor_1' : {
            type : 'range',
            value : 24,
            max : 30
        },
        'Floor_2' : {
            type : 'range',
            value : 23,
            max : 30,
        },
        'Basement' : {
            type : 'range',
            value : 24,
            max : 30,
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
        'Periodical': {
            type: 'switch',
            value: false
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
        if (newValue == true) {
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
        dev['thermostat']['Work time'] = heater_counter.toString();
        heater_counter = 0;
    }
});

defineRule('th.switchPumpsByTemperature', {
    whenChanged: [
        sensors.floor1, 
        sensors.floor2, 
        sensors.basement
    ],
    then: function (newValue, devName, cellName) {
        if (!dev['thermostat']['Enabled']) {
            return;
        }
        if (dev['thermostat']['Simple']) {
            managePumpSimple(sensors.floor1);
        } else {
            var tempDev = devName + '/' + cellName;
            var thermo = dev['thermostat'][devicesByTemperature[tempDev]['thermo']]; // production
            managePumps(newValue, thermo, tempDev);
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
            'Floor_1': sensors.floor1,
            'Floor_2': sensors.floor2,
            'Basement': sensors.basement
        };

        if (dev['thermostat']['Simple']) {        
            if (cellName == 'Floor_1') {
                managePumpSimple(sensors.floor1);
            }            
        } else {
            var device = splitDevice(map[cellName]);
            var temp = dev[device['device']][device['cell']];
            managePumps(temp, newValue, map[cellName]);
        }
    }
});


defineRule('th.displayPressure', {
    whenChanged: [sensors.pressure],
    then: function (newValue, devName, cellName) {
        // https://pcus.ru/image/cache/catalog/products/sensors/other/4225_7-1000x1340.jpg
        // Vout = Vcc(0.75 * P + 0.1)
      	var pressure = (10 * (parseFloat(newValue) / parseFloat(dev[sensors.vcc]) - 0.1) / 0.75).toFixed(1);
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
        /*if (!dev['thermostat']['Enabled']) {
            return;
        }*/           
        return;
        if (newValue < PRESSURE_LOW_THRESHOULD) {
            dev['thermostat']['Enabled'] = 0;
            dev['thermostat']['Periodical'] = 0;
        }
    }
});

defineRule('th.checkPumps', {
    whenChanged: [
        sensors.boiler_pump
    ],
    then: function (newValue, devName, cellName) {
        /*if (!dev['thermostat']['Enabled']) {
            return;
        } */       
        if (boiler == false && newValue == false) {
            pump1 = false;
            pump2 = false;      
            pumpBasement = false;      
        }
    }
});

defineRule("th.shutdownBoiler", {
    whenChanged: "thermostat/Enabled",
    then: function (newValue, devName, cellName) {
        if (newValue == false) {
            switchBoiler(false);
            pump1 = false;
            pump2 = false;
            pumpBasement = false;
        }
    }
});


defineRule('th.checkPeriodical', {
    whenChanged: [
        'thermostat/Periodical'
    ],
    then: function (newValue, devName, cellName) {
        if (newValue == true) {
            dev['thermostat']['Enabled'] = false;
        } else {
            switchBoiler(false);
            pump1 = false;
            pump2 = false;
            pumpBasement = false;  
    }
    }
});

defineRule("th.enablePeriodical", {
    asSoonAs: 
        function () {
        if (dev['thermostat']['Periodical'] == false) {
        return false;
        }
            var date = new Date();
            return (date.getMinutes() >= 0 && date.getMinutes() < 20) || (date.getMinutes() >= 30 && date.getMinutes() < 50);
        }
    ,
    then: function () {
        pumpValueByTemp(sensors.floor1, true);
        pumpValueByTemp(sensors.floor2, true);
        pumpValueByTemp(sensors.basement, true);
        switchBoiler(true);
    }
});


defineRule("th.disablePeriodical", {
    asSoonAs: 
        function () {
        if (dev['thermostat']['Periodical'] == false) {
        return false;
        }
            var date = new Date();
            return (date.getMinutes() >= 20 && date.getMinutes() < 30) || (date.getMinutes() >= 50 && date.getMinutes() < 60);
        }
    ,
    then: function () {
        switchBoiler(false);
    }
});


function pumpsEnabled()
{
    var c = 0;

    if (pump1 == true) {
        c++;
    }
    if (pump2 == true) {
        c++;
    }
    if (pumpBasement == true) {
        c++;
    }
    return c;
}

function switchBoiler(enable)
{
    if (enable && boiler == false) {
        boiler = true;
    } else if (!enable && boiler == true) {
        boiler = false;
    }
}

function pumpValueByTemp(tempDev, value)
{

    var relay = devicesByTemperature[tempDev]['relay'];

    if (value === undefined) {
        return dev['relays'][relay];
    } else {
        dev['relays'][relay] = value;
    }
}

function managePumps(temp, thermo, tempDev)
{
    if (temp < thermo - HYSTERESIS_DOWN) {
        pumpValueByTemp(tempDev, true);
        switchBoiler(true);
    } else if (temp > thermo + HYSTERESIS_UP && pumpValueByTemp(tempDev) == true) {
        if (pumpsEnabled() == 1) {
            switchBoiler(false);
        } else {
            pumpValueByTemp(tempDev, false);
        }
    }
}

function managePumpSimple(sensor)
{
    var device = splitDevice(sensor);
    var temp = dev[device['device']][device['cell']];
    var thermo = dev['thermostat'][devicesByTemperature[sensor]['thermo']];

    if (temp < thermo - HYSTERESIS_DOWN && pumpValueByTemp(sensor) == false) {
        pumpValueByTemp(sensors.floor1, true);
        pumpValueByTemp(sensors.floor2, true);
        pumpValueByTemp(sensors.basement, true);
        switchBoiler(true);
    } else if (temp > thermo + HYSTERESIS_UP && pumpValueByTemp(sensor) == true) {
        switchBoiler(false);
    }  
}

function splitDevice(device)
{
    var elements = device.split('/');
    return {
        'device': elements[0],
        'cell': elements[1]
    }
}
