#!/usr/bin/python3
import sys
import getopt
import util

def main():
    number = ""
    text = ""

    try:
        opts, args = getopt.getopt(sys.argv[2:],"t:n:")
    except getopt.GetoptError as err:
        opts = []

    if (not opts):
        print("dio sms_client -n <number> -t <text>|<stdin>")
        sys.exit(1)

    for opt, arg in opts:
        if opt == "-n":
            number = arg
        if opt == "-t":
            text = arg

    if (text == ""):
        text = "".join(sys.stdin.readlines()).strip()

    if (number and text):
        util.send_sms(number, text)

    return

