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
    runShellCommand("/etc/wb-rules/scripts/ups.sh charge", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
		dev['ups']['Battery charge'] = capturedOutput;
      }
    });	
    runShellCommand("/etc/wb-rules/scripts/ups.sh voltage", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
		dev['ups']['Input voltage'] = capturedOutput;
      }
    });	    
  }
});