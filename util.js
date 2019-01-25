defineVirtualDevice('util', {
    title: 'Util', //
    cells: {
        'Occupancy': {
            type: 'switch',
            value: false
        },
        'Alive': {
            type: 'text',
            value: ''
        }
    }
});

defineRule("_synology_home_mode", {
  whenChanged: "util/Occupancy",
  then: function (newValue, devName, cellName) {
    runShellCommand("/etc/wb-rules/scripts/homemode.py " + ((newValue == 1) ? 'on' : 'off'));
  }
});

defineRule("_keep_alive", {
  when: cron("1 * * * *"),
  then: function () {
    var d = new Date();
    dev.util['Alive'] = Math.floor(d.getTime() / 1000).toString();
  }
});
