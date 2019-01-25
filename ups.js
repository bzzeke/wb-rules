defineVirtualDevice('ups', {
    title: 'UPS',
    cells: {
        'Battery charge' : {
            type : 'text',
          	value: ''
        },
        'Input voltage' : {
            type : 'text',
          	value: ''
        },
        'Load' : {
            type : 'text',
          	value: ''
        },      
        'Status' : {
            type : 'text',
          	value: ''
        }
    }
});


defineRule("ups.status", {
    when: cron("@every 10s"),
    then: function () {
        runShellCommand("/etc/wb-rules/scripts/ups.py", {
            captureOutput: true,
            exitCallback: function (exitCode, capturedOutput) {
                var data = JSON.parse(capturedOutput);
                dev['ups']['Battery charge'] = data['battery.charge'] || 0;
                dev['ups']['Input voltage'] = data['input.voltage'] || 0;
                dev['ups']['Load'] = data['ups.load'] ? data['ups.load'] + '%' : 0;

		if (data['ups.status']) {
                    if (data['ups.status'] == 'OL' || data['ups.status'] == 'OL CHRG' || data['ups.status'] == 'OL CHRG LB') {
                        dev['ups']['Status'] = 'Online';
                    } else if (data['ups.status'] == 'OB' || data['ups.status'] == 'OB DISCHRG') {
                        dev['ups']['Status'] = 'Battery';
                    } else {
                        dev['ups']['Status'] = 'Low battery';
                  }
                } else if (data['error']) {
                    dev['ups']['Status'] = data['error'];
                }
            }
        });
    }
});
