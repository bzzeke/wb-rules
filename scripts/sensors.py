#!/usr/bin/python3
import subprocess
import json
import os
import util

temp_sensors = [
    'lmTempSensorsValue.31',
    'lmTempSensorsValue.32',
    'lmTempSensorsValue.33',
    'lmTempSensorsValue.34',
    'lmTempSensorsValue.35',
    'lmTempSensorsValue.36'
]

fan_sensors = [
    'lmFanSensorsValue.17',
    'lmFanSensorsValue.20'
]

temp = 0;
fans = [];

res = subprocess.check_output("snmpwalk -v 2c -c %s -O eqs %s %s" % (os.environ['SNMP_COMMUNITY'], os.environ['SNMP_HOST'], os.environ['SNMP_SENSORS_OID']), shell=True)
for line in res.splitlines():
    parts = line.decode().split(' ', 2);
    if parts[0] in temp_sensors:
        if int(parts[1]) > temp:
            temp = int(parts[1])
    elif parts[0] in fan_sensors:
        fans.append(parts[1])

print(json.dumps({
    'cpu_temp': temp / 1000,
    'fans': fans
}))
