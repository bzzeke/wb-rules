#!/usr/bin/python3
import subprocess
import json
import os
import util

fields = [
    'battery.charge',
    'input.voltage',
    'ups.load',
    'ups.status',
]

result = {}

res = subprocess.check_output("upsc %s" % (os.environ['UPS_URL']), shell=True)
for line in res.splitlines():
    parts = line.decode().split(':', 2);
    if parts[0] in fields:
        result[parts[0]] = parts[1].strip()

print(json.dumps(result))
