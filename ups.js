startTicker("clickTimer", 5000);

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

defineRule("doClick", {
  when: function () {
    return timers.clickTimer.firing;
  },
  then: function () {
    runShellCommand("/etc/wb-rules/scripts/ups.py", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
        var data = JSON.parse(capturedOutput);
		dev['ups']['Battery charge'] = data['battery.charge'] || 0;
		dev['ups']['Input voltage'] = data['input.voltage'] || 0;
        dev['ups']['Load'] = data['ups.load'] ? data['ups.load'] + '%' : 0;
        
        if (data['ups.status']) {
			dev['ups']['Status'] = (data['ups.status'] == 'OL' ? 'Online' : (data['ups.status'] == 'OB' ? 'Battery' : 'Low battery'));
        } else if (data['error']) {
          	dev['ups']['Status'] = data['error'];
        }
      }
    });	        
  }
});