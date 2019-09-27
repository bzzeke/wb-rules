#!/usr/bin/python3

import os
import socket
import time
import mosquitto as mqtt
import threading
import sys
import util
from modules.notifier.notifier import notify

client = mqtt.Mosquitto()

SUBSCRIBE_TOPIC="/devices/+/controls/+/meta/error"
PUBLISH_TOPIC_HOSTS="/monitoring/hosts/%s"
PUBLISH_TOPIC_DEVICES="/monitoring/devices/%s"

class HostChecker:
    addresses = {}
    sleep = 20
    last_state = {}
    def __init__(self, addresses):
        self.addresses = addresses.split(",")

        s = threading.Thread(target = self.loop)
        s.daemon = True
        s.start()

    @staticmethod
    def tcp(host, port=65533, timeout=2, tries=0):
        max_tries = 3
        s = socket.socket()
        s.settimeout(timeout)
        result = False
        try:
            s.connect((host, int(port)))
            s.close()
            result = True
        except Exception as e:
            if e == socket.errno.ECONNREFUSED:
                result = True

        if result == False and tries < max_tries:
            return HostChecker.tcp(host, port, timeout, tries + 1)

        return result

    def notify(self, address, result):

        if result:
            message = "Host is online: %s" % (address)
        else:
            message = "Host is down: %s" % (address)

        notify(message)

    def loop(self):
        while True:
            for address in self.addresses:
                host, port = address.split(":")
                result = HostChecker.tcp(host, port)

                if address in self.last_state and self.last_state[address] != result:
                    self.notify(address, result)

                self.last_state[address] = result
                publish(PUBLISH_TOPIC_HOSTS % address, result)

            time.sleep(self.sleep)

class DeviceChecker:
    state = {}
    devices = {}
    sleep = 20
    tdiff = 20
    last_state = {}

    def __init__(self, devices):
        self.set_devices(devices)

        s = threading.Thread(target = self.loop)
        s.daemon = True
        s.start()

    def set_devices(self, devices):
        for device in devices.split(","):
            dev, control = device.split(":")
            self.devices[dev] = control

    def on_connect(self, client, userdata, rc):
        if rc != 0:
            return

        client.subscribe(SUBSCRIBE_TOPIC)

    def on_message(self, client, userdata, msg):

        parts = msg.topic.split("/")
        device = parts[2]
        control = parts[4]

        if device in self.devices and self.devices[device] == control:
            if msg.payload == b"r":
                self.state[device] = time.time()
            elif device in self.state:
                del self.state[device]

    def notify(self, device, result):

        if result:
            message = "Device is online: %s" % (device)
        else:
            message = "Device is down: %s" % (device)

        notify(message)

    def loop(self):
        while True:
            devs = {}
            for key in self.devices:
                devs[key] = True

            ctime = time.time()

            for key, value in self.state.items():
                if ctime - value > self.tdiff:
                    devs[key] = False

            for key, value in devs.items():

                if key in self.last_state and self.last_state[key] != value:
                    self.notify(key, value)

                self.last_state[key] = value

                publish(PUBLISH_TOPIC_DEVICES % key, value)

            time.sleep(self.sleep)

def publish(topic, result):
    client.publish(topic, 1 if result else 0, 0, True)


def main():
    try:
        hc = HostChecker(os.environ["HOST_CHECKER"])
        dc = DeviceChecker(os.environ["DEVICE_CHECKER"])

        client.on_connect = dc.on_connect
        client.on_message = dc.on_message

        client.connect(os.environ["MQTT_HOST"], int(os.environ["MQTT_PORT"]), 10)
        util.prnt("[monitoring] Starting...")
        while True:
            rc = client.loop()
            if rc != 0:
                break
    except Exception as e:
        sys.exit(1)
