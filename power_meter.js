var initialValueDay = 159368;
var initialValueNight = 92572;
var dayStart = 8;
var dayEnd = 23;

defineVirtualDevice('power_meter', {
    title: 'Power meter',
    cells: {
        'Total power day' : {
            type : 'power_consumption',
            value : initialValueDay
        },
        'Total power night' : {
            type : 'power_consumption',
            value : initialValueNight
        }
    }
});

defineRule('pm.power', {
    whenChanged: ['wb-map3h_116/Total AP energy'],
    then: function (newValue, devName, cellName) {
      
        var d = new Date();
        if (d.getHours() >= dayStart && d.getHours() <= dayEnd) {
            dev['power_meter']['Total power day'] = (initialValueDay + newValue - dev['power_meter']['Total power night'] + initialValueNight).toFixed(4);
        } else {
            dev['power_meter']['Total power night'] = (initialValueNight + newValue - dev['power_meter']['Total power day'] + initialValueDay).toFixed(4);
        }
    }
});
