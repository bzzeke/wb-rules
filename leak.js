/*var leak_state = 0;

defineRule("_system_leak_warning", {
  whenChanged: "wb-adc/A5",
  then: function (newValue, devName, cellName) {
    if ( newValue > 8 && leak_state == 0) {
        runShellCommand("/opt/sendsms.sh \"LEAK DETECTED\"");
        leak_state  = 1;
    } else if (newValue < 2) {
        leak_state = 0;
    }
   }
});*/