var heaterInit = false;
var waterSupply = {
    'heaterStatus': 'wb-gpio/MOD2_IN3',
    'heaterRelay': 'wb-gpio/MOD1_OUT1',
    'pressure': 'wb-adc/A3',
    'leak': 'wb-adc/A4'
};

defineAlias('waterHeaterStatus', waterSupply.heaterStatus);
defineAlias('waterHeaterRelay', waterSupply.heaterRelay);
defineAlias('waterPressure', waterSupply.pressure);

defineVirtualDevice('waterSupply', {
    title: 'Water supply',
    cells: {
        'Heater': {
          	type: 'switch',
          	value: false
        },
        'Pressure' : {
            type : 'text',
            value : ''
        },
        'Leak' : {
            type : 'switch',
            value : 0,
            readonly: true
        }      
    }
});

defineRule('ws.pressure', {
    whenChanged: [waterSupply.pressure],
    then: function (newValue, devName, cellName) {
      	var coefficient = 0.8;
      	var shift = 0.5;
        dev.waterSupply['Pressure'] = (coefficient * newValue + shift).toFixed(1);
    }
});

defineRule('ws.leak', {
    whenChanged: [
      waterSupply.leak,
    ],
    then: function (newValue, devName, cellName) {
        var threshold = 8;
        dev.waterSupply['Leak'] = newValue >= threshold;
    }
});

defineRule('ws.heaterStatus', {
    whenChanged: [waterSupply.heaterStatus],
    then: function (newValue, devName, cellName) {
        dev.waterSupply['Heater'] = newValue;
    }
});

defineRule('ws.switchHeater', {
    whenChanged: ['waterSupply/Heater'],
    then: function (newValue, devName, cellName) {
		waterHeaterRelay = 1;
      	setTimeout(function() {
            waterHeaterRelay = 0;
        }, 1000);
    }
});

defineRule('ws.initHeaterStatus', {
    when: function() {
        return heaterInit == false;
    },
    then: function () {
        heaterInit = true;
      	dev.waterSupply['Heater'] = waterHeaterStatus;
    }
});
