var heaterInit = false;
var heaterStatusChanged = false;
var waterSupply = {
    'heaterStatus': 'leak_sensor/S1',
    'heaterRelay': 'leak_sensor/K1',
    'pressure': 'wb-adc/A2',
    'vcc': 'wb-adc/5Vout'
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
        // https://pcus.ru/image/cache/catalog/products/sensors/other/4225_7-1000x1340.jpg
        // Vout = Vcc(0.75 * P + 0.1)
      	var pressure = (10 * (parseFloat(newValue) / parseFloat(dev[waterSupply.vcc]) - 0.1) / 0.75).toFixed(1);
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
            waterHeaterRelay = true;
            setTimeout(function() {
                waterHeaterRelay = false;
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

