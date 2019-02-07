#!/usr/bin/python3
import subprocess
import os
import lib.util
import sys

def send(text):
    res = subprocess.Popen(['ssmtp', os.environ['NOTIFY_EMAIL']], stdin=subprocess.PIPE)
    res.communicate(input=str.encode(text))[0]

header = """To: %s
From: %s
Subject: Home Mode
""" % (os.environ['NOTIFY_EMAIL'], os.environ['FROM_EMAIL'])

hm_on = """%s
System is now in Home Mode
""" % (header)

hm_off = """%s
System has left Home Mode
""" % (header)

if sys.argv[1] == 'on':
    send(hm_on)
else:
    send(hm_off)
