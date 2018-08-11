defineVirtualDevice('util', {
    title: 'Util', //
    cells: {
        'Occupancy': {
            type: 'switch',
            value: false
        }
    }
});

defineRule("_synology_home_mode", {
  whenChanged: "util/Occupancy",
  then: function (newValue, devName, cellName) {
    runShellCommand("/etc/wb-rules/scripts/homemode.sh " + ((newValue == 1) ? 'on' : 'off'));
  }
});
