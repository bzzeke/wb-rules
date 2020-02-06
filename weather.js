defineVirtualDevice('weather', {
    title: 'Weather',
    cells: {
        'LIM AQ' : {
            type : 'text',
            value: ''
        },
        'ULN wind' : {
            type : 'text',
            value: ''
        },
        'ULN wind direction' : {
            type : 'text',
            value: ''
        },
        'ULN temperature' : {
            type : 'temperature',
            value: 0
        }
    }
});


defineRule("weather.status", {
    when: cron("@every 15m"),
    then: function () {
        runShellCommand("/etc/wb-rules/services/dio weather", {
            captureOutput: true,
            exitCallback: function (exitCode, capturedOutput) {
                var data = JSON.parse(capturedOutput);
                dev['weather']['LIM AQ'] = data['air_quality'] || 0
                dev['weather']['ULN wind'] = data['wind'] || 0;
                dev['weather']['ULN wind direction'] = data['wind_direction'] || 0;
                dev['weather']['ULN temperature'] = data['temperature'] || 0;
            }
        });
    }
});
