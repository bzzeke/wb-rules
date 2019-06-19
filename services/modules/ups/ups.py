#!/usr/bin/python3
import subprocess
import json
import os

fields = [
    'battery.charge',
    'input.voltage',
    'ups.load',
    'ups.status',
]

def main():
    result = {}

    try:
        res = subprocess.check_output("upsc %s" % (os.environ['UPS_URL']), stderr=subprocess.STDOUT, shell=True)
    except subprocess.CalledProcessError as ex:
        result['error'] = ex.output.decode().strip()
    else:
        for line in res.splitlines():
            parts = line.decode().split(':', 1)
            if parts[0] in fields:
                result[parts[0]] = parts[1].strip()

    print(json.dumps(result))
