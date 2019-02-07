#!/usr/bin/python3
import time
import os
from lib.modem import Modem
import sys
import socket
import json
import threading
import queue
import syslog
import getopt
import signal

SOCKET_NAME = "/tmp/smsserver"
DEVICE = "/dev/ttyGSM"
PACKET_SIZE = 4096
MAX_CONNECTIONS = 5

q = queue.Queue()

def listener():
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        os.remove(SOCKET_NAME)
    except OSError:
        pass

    sock.bind(SOCKET_NAME)
    sock.listen(MAX_CONNECTIONS)

    while True:
        conn, addr = sock.accept()
        data = conn.recv(PACKET_SIZE)
        if data:
            q.put(json.loads(data.decode('utf-8')))
            conn.sendall(b"OK")
            conn.close()

        time.sleep(1)

def parse_options():
    try:
        opts, args = getopt.getopt(sys.argv[1:],"d:")
    except getopt.GetoptError as err:
        print("server.py -d <device>")
        sys.exit(2)
    if (not opts):
        print("server.py -d <device>")
        sys.exit(2)

    for opt, arg in opts:
        if opt == "-d":
            DEVICE = arg


def signal_handler(signal, frame):
    sys.exit(0)

def main():

    signal.signal(signal.SIGINT, signal_handler)
    t = threading.Thread(target=listener)
    t.daemon = True
    t.start()
    modem = False

    while True:
        try:
            if (not modem or not modem.isOpen()):
                modem = Modem(DEVICE)
                syslog.syslog("SMSD server: started")
            try:
                message = q.get(False)
                modem.sendSMS(message['number'], message['text'])
            except:
                pass

            print("check messages")
            modem.checkMessages()

        except Exception as e:
            a,b,c = sys.exc_info()
            print(vars(c))

            syslog.syslog(syslog.LOG_ERR, "SMSD server: got error, %s" % e)
            time.sleep(5)
            if (modem):
                modem.close()
            continue

    modem.close()
    return


if __name__ == '__main__':

    main()
