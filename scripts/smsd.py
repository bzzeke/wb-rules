#!/usr/bin/python3
import subprocess
import json
import os
import util

def log(text):
    with open(os.environ['SMSD_LOG'], 'a') as file:
        file.write(text)

# Check for sender number
if os.environ['SMS_1_NUMBER'] != os.environ['PHONE']:
    exit

# Handle commands
if os.environ['SMS_1_TEXT'] == 'reboot':

    res = subprocess.Popen('ssh -i %s %s "/system reboot" 2>&1' % (os.environ['MIKROTIK_KEY'], os.environ['MIKROTIK_URL']))
    output = res.communicate()[0]
    text = ''

    if res.returncode == 0:
        text = 'Rebooted successfuly [%s]' % (output)
    elif res.returncode == 1:
        text = 'Failed to reboot [%s]' % (output)
    else:
        text = 'Other problem [%s]' % (output)

    log(text)

    res = subprocess.Popen('gammu-smsd-inject TEXT %s -text "%s" 2>&1' % (os.environ['PHONE'], text))

    log(res.communicate()[0])

elif os.environ['SMS_1_TEXT'] == 'stats':
    log('stats')
