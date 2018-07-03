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
        'Status' : {
            type : 'text',
          	value: ''
        },      
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
    runShellCommand("/etc/wb-rules/scripts/ups.sh status", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
        capturedOutput = capturedOutput.replace(/[ \t\n]/, '');
		dev['ups']['Status'] = (capturedOutput == 'OL' ? 'Online' : (capturedOutput == 'OB' ? 'Battery' : 'Low battery'));
      }
    });	    

    
  }
});