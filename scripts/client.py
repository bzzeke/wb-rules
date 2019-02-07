#!/usr/bin/python3
import syslog
import sys
import socket
import json
import getopt

SOCKET_NAME = "/tmp/smsserver"

def send_sms(number, text):
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        sock.connect(SOCKET_NAME)
        sock.sendall(json.dumps({
            "number": number,
            "text": text
        }).encode('utf-8'))
        data = sock.recv(1024)
        if (data == b"OK"):
            syslog.syslog("SMSD client: message was put to queue")
            return True

        syslog.syslog(syslog.LOG_ERR, "SMSD client: message was not put to queue")
    except Exception as e:
        syslog.syslog(syslog.LOG_ERR, "SMSD client: %s" %e)
        raise

    return False

def main():
    number = ""
    text = ""

    try:
        opts, args = getopt.getopt(sys.argv[1:],"t:n:")
    except getopt.GetoptError as err:
        print("client.py -n <number>")
        sys.exit(2)
    if (not opts):
        print("client.py -n <number>")
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-n":
            number = arg
        if opt == "-t":
            text = arg

    if (text == ""):
        text = "".join(sys.stdin.readlines()).strip()

    if (number and text):
        send_sms(number, text)

    return


if __name__ == '__main__':
    main()
