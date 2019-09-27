var cryDuration = 0;

defineVirtualDevice('util', {
    title: 'Util', //
    cells: {
        'Occupancy': {
            type: 'switch',
            value: false
        },
        'Cry Alarm': {
            type: 'switch',
            value: false
        },
        'Alive': {
            type: 'text',
            value: ''
        },
        'Floor 1 Air Quality': {
            type: 'text',
            value: ''
        },
        'Floor 2 Air Quality': {
            type: 'text',
            value: ''
        },
        'Basement Air Quality': {
            type: 'text',
            value: ''
        },
        'Test': {
            type: 'temperature',
            value: 0
        }
    }
});

defineRule("_air_quality", {
    whenChanged: ["sensor_0/CO2", "sensor_1/CO2", "sensor_2/CO2"],
    then: function (newValue, devName, cellName) {
        var status = 0;
        var map = {
            'sensor_0': 'Basement Air Quality',
            'sensor_1': 'Floor 1 Air Quality',
            'sensor_2': 'Floor 2 Air Quality'
        };

        if (newValue < 800) {
            status = 1;
        } else if (newValue < 1000) {
            status = 2;
        } else if (newValue < 1200) {
            status = 3;
        } else if (newValue < 1400) {
            status = 4;
        } else {
            status = 5;
        }

        dev.util[map[devName]] = status;
    }
});

defineRule("_keep_alive", {
    when: cron("1 * * * *"),
    then: function () {
        var d = new Date();
        dev.util['Alive'] = Math.floor(d.getTime() / 1000).toString();
    }
});

defineRule("_cry_alarm", {
    whenChanged: ["sensor_2/Sound Level"],
    then: function(newValue, devName, cellName) {
        var threshould = 40;
        var interval = 3; // 3 seconds
        var email = 'notify@delyanka.io';
        var d = new Date();
        var ts = Math.floor(d.getTime() / 1000);

        if (!dev.util['Cry Alarm']) {
            return;
        }

        if (newValue < threshould) {
            cryDuration = 0;
        } else {
            if (cryDuration > 0) {
                if (ts - cryDuration > interval) {
                    Notify.sendEmail(email, 'Home', 'Looks like someone is crying, level - ' + newValue);
                }
            } else {
                cryDuration = ts;
            }
        }
    }
});

defineRule("_garage_relay", {
    whenChanged: ["garage/Relay 1"],
    then: function(newValue, devName, cellName) {
        if (newValue == 1) {
            setTimeout(function() {
                dev[devName][cellName] = 0;
            }, 1000);
        }
    }
});
