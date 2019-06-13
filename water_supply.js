var heaterInit = false;
var heaterStatusChanged = false;
var waterSupply = {
    'heaterStatus': 'leak_sensor/S1',
    'heaterRelay': 'leak_sensor/K1',
    'pressure': 'wb-adc/A2'
};

defineAlias('waterHeaterStatus', waterSupply.heaterStatus);
defineAlias('waterHeaterRelay', waterSupply.heaterRelay);
defineAlias('waterPressure', waterSupply.pressure);

defineVirtualDevice('water_supply', {
    title: 'Water supply',
    cells: {
        'Heater': {
              type: 'switch',
              value: false
        },
        'Pressure' : {
            type : 'text',
            value : ''
        }
    }
});

defineRule('ws.pressure', {
    whenChanged: [waterSupply.pressure],
    then: function (newValue, devName, cellName) {
        var coefficient = 1.30459;
        var shift = -0.500871;
        var pressure = (coefficient * newValue + shift).toFixed(1);
        if (pressure != dev.water_supply['Pressure']) {
            dev.water_supply['Pressure'] = pressure;
        }
    }
});

defineRule('ws.heaterStatus', {
    whenChanged: [waterSupply.heaterStatus],
    then: function (newValue, devName, cellName) {
        if (newValue != dev.water_supply['Heater']) {
            heaterStatusChanged = true;
        }
        dev.water_supply['Heater'] = newValue;
    }
});

defineRule('ws.switchHeater', {
    whenChanged: ['water_supply/Heater'],
    then: function (newValue, devName, cellName) {
        if (heaterStatusChanged) {
            heaterStatusChanged = false;
        } else {
            waterHeaterRelay = 1;
            setTimeout(function() {
                waterHeaterRelay = 0;
            }, 1000);
        }
    }
});

defineRule('ws.initHeaterStatus', {
    when: function() {
        return heaterInit == false;
    },
    then: function () {
        heaterInit = true;
        heaterStatusChanged = true;
        dev.water_supply['Heater'] = waterHeaterStatus;
    }
});

