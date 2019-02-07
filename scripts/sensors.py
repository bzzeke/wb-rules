#!/usr/bin/python3
import subprocess
import json
import os
import lib.util

temp_sensors = [
    'Core 0',
    'Core 1',
    'Core 2',
    'Core 3',
    'Core 4',
    'Core 5'
]

fan_sensors = [
    'fan2',
    'fan5'
]

temp = 0
fans = []
fields = {}

try:
    res = subprocess.check_output("snmpwalk -v 2c -c %s -O eqs %s %s" % (os.environ['SNMP_COMMUNITY'], os.environ['SNMP_HOST'], os.environ['SNMP_SENSORS_OID']), stderr=subprocess.STDOUT, shell=True)
except subprocess.CalledProcessError as ex:
    temp = 999000
else:
    for line in res.splitlines():
        parts = line.decode().split(' ', 1)
        fields[parts[0].strip()] = parts[1].strip()

    for field in fields:
        if fields[field] in temp_sensors:
            if int(fields[field.replace('Device', 'Value')]) > temp:
                temp = int(fields[field.replace('Device', 'Value')])
        elif fields[field] in fan_sensors:
            fans.append(fields[field.replace('Device', 'Value')])

print(json.dumps({
    'cpu_temp': temp / 1000,
    'fans': fans
}))

