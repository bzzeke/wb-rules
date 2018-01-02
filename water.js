defineVirtualDevice('water', {
    title: 'Water', //
    cells: {
        'Input pressure' : {
            type : 'text',
            value : ''
        }
    }
});

defineRule('dl_set_water_pressure', {
    whenChanged: [
		'wb-adc/A3'
    ],
    then: function (newValue, devName, cellName) {
      	var coefficient = 0.8;
      	var shift = 0.5;
        dev.water['Input pressure'] = (coefficient * newValue + shift).toFixed(1);
    }
});
