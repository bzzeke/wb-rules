var initialValueDay = 159368;
var initialValueNight = 92572;
var dayStart = 8;
var dayEnd = 23;

defineVirtualDevice('power_meter', {
    title: 'Power meter',
    cells: {
        'L1' : {
            type : 'text',
            value : 0
        },
        'L2' : {
            type : 'text',
            value : 0
        },
        'L3' : {
            type : 'text',
            value : 0
        },      
        'Power' : {
            type : 'text',
            value : 0
        },      
        'Total power day' : {
            type : 'text',
            value : initialValueDay
        },
        'Total power night' : {
            type : 'text',
            value : initialValueNight
        },
        'Total power' : {
            type : 'text',
            value : 0
        }
    }
});

defineRule('pm.power', {
    whenChanged: ['wb-map3h_116/Total P', 'wb-map3h_116/Total AP energy'],
    then: function (newValue, devName, cellName) {
      
		if (cellName == 'Total AP energy') {
            var d = new Date();
            if (d.getHours() >= dayStart && d.getHours() <= dayEnd) {
                dev['power_meter']['Total power day'] = initialValueDay + newValue - dev['power_meter']['Total power night'] + initialValueNight;
            } else {
                dev['power_meter']['Total power night'] = initialValueNight + newValue - dev['power_meter']['Total power day'] + initialValueDay;
            }
          	dev['power_meter']['Total power'] = newValue;
        } else {
            dev['power_meter']['Power'] = newValue;
        }
    }
});

defineRule('pm.lines', {
    whenChanged: ['wb-map3h_116/Urms L1', 'wb-map3h_116/Urms L2', 'wb-map3h_116/Urms L3', 'wb-map3h_116/Irms L1', 'wb-map3h_116/Irms L2', 'wb-map3h_116/Irms L3'],
    then: function (newValue, devName, cellName) {
      
        var params = cellName.split(' ');
      	var values = dev['power_meter'][params[1]].split(' | ');
        if (params[0] == 'Urms') {
            values[0] = newValue;
        } else {
            values[1] = newValue;
        }
		dev['power_meter'][params[1]] = values.join(' | ');
    }
});
