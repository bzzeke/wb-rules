startTicker("clickTimer", 5000);

defineVirtualDevice('ups', {
    title: 'UPS',
    cells: {
        'Battery charge' : {
            type : 'text',
          	value: 'test'
        },
        'Input voltage' : {
            type : 'text',
          	value: 'test'
        } 
    }
});

defineRule("doClick", {
  when: function () {
    return timers.clickTimer.firing;
  },
  then: function () {
    runShellCommand("upsc ups@192.168.34.6 | grep battery.charge: | awk '{print $2}'", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
		dev['ups']['Battery charge'] = capturedOutput;
      }
    });	
    runShellCommand("upsc ups@192.168.34.6 | grep input.voltage: | awk '{print $2}'", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
		dev['ups']['Input voltage'] = capturedOutput;
      }
    });	    
  }
});