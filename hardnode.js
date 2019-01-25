defineVirtualDevice('hardnode', {
    title: 'Hardnode',
    cells: {
        'CPU temperature' : {
            type : 'text',
          	value: ''
        },
        'Fan1 speed' : {
            type : 'text',
          	value: ''
        },
        'Fan2 speed' : {
            type : 'text',
          	value: ''
        }
    }
});

defineRule("hardnode.status", {
    when: cron("@every 10s"),
    then: function () {
        runShellCommand("/etc/wb-rules/scripts/sensors.py", {
            captureOutput: true,
            exitCallback: function (exitCode, capturedOutput) {
                var data = JSON.parse(capturedOutput);
                dev['hardnode']['CPU temperature'] = data['cpu_temp'];
                dev['hardnode']['Fan1 speed'] = data['fans'][0] || 0;
                dev['hardnode']['Fan2 speed'] = data['fans'][1] || 0;
            }
        });
    }
});
