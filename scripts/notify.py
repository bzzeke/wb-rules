#!/usr/bin/python3
import subprocess
import os
import util
import sys
import argparse

def send(text):
    res = subprocess.Popen(['ssmtp', os.environ['NOTIFY_EMAIL']], stdin=subprocess.PIPE)
    res.communicate(input=str.encode(text))[0]

parser = argparse.ArgumentParser()
parser.add_argument("text")
args = parser.parse_args()

header = """To: %s
From: %s
Subject: Notify
""" % (os.environ['NOTIFY_EMAIL'], os.environ['FROM_EMAIL'])

message = """%s
%s
""" % (header, args.text)

send(message)
