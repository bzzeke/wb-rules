#!/usr/bin/python3
import subprocess
import json
import os
import util

def log(text):
    with open(os.environ['SMSD_LOG'], 'a') as file:
        file.write(text + '\n')

def send(text):
    return subprocess.check_output('gammu-smsd-inject TEXT %s -text "%s" -unicode' % (os.environ['PHONE'], text), stderr=subprocess.STDOUT, shell=True)

# Check for sender number
if os.environ['SMS_1_NUMBER'] != os.environ['PHONE']:
    exit

# Handle commands
if os.environ['SMS_1_TEXT'] == 'reboot':

    try:
        output = subprocess.check_output('ssh -i %s %s "/system reboot"' % (os.environ['MIKROTIK_KEY'], os.environ['MIKROTIK_URL']), stderr=subprocess.STDOUT, shell=True)
    except subprocess.CalledProcessError as exc:
        text = 'Failed to reboot [%s %s]' % (output.decode(), exc.output.decode())
    else:
        text = 'Rebooted successfuly [%s]' % (output.decode())

    log(text)
    output = send(text)
    log(output.decode())

elif os.environ['SMS_1_TEXT'] == 'ping':
    text = 'pong'
    log(text)
    output = send(text)
    log(output.decode())

elif os.environ['SMS_1_TEXT'] == 'reboot_switch':
    try:
        output = subprocess.check_output('%s/unify.py reboot' % (os.path.dirname(os.path.realpath(__file__))), stderr=subprocess.STDOUT, shell=True)
    except subprocess.CalledProcessError as exc:
        text = 'Failed to reboot switch [%s]' % (exc.output.decode())
    else:
        text = 'Switch rebooted successfuly [%s]' % (output.decode())

    log(text)
    output = send(text)
    log(output.decode())

elif os.environ['SMS_1_TEXT'] == 'switch_ports':
    try:
        output = subprocess.check_output('%s/unify.py switch_ports' % (os.path.dirname(os.path.realpath(__file__))), stderr=subprocess.STDOUT, shell=True)
    except subprocess.CalledProcessError as exc:
        text = 'Failed to switch ports [%s]' % (exc.output.decode())
    else:
        text = 'Ports switched successfuly [%s]' % (output.decode())

    log(text)
    output = send(text)
    log(output.decode())

