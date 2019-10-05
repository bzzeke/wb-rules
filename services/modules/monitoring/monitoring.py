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
    def __init__(self, prefix):
        self.addresses = self.parse_hosts(prefix)
        s = threading.Thread(target = self.loop)
        s.daemon = True
        s.start()

    def parse_hosts(self, prefix):
        it = 0
        result = {}
        while "%s_%i" % (prefix, it) in os.environ:
            name, url = os.environ["%s_%i" % (prefix, it)].split(",")
            host, port = url.split(":")
            result[name] = {
                "host": host,
                "port": int(port)
            }
            it += 1

        return result

    @staticmethod
    def tcp(host, port=65533, timeout=2, tries=0):

        max_tries = 3
        result = False
        try:
            s = socket.socket()
            s.settimeout(timeout)
            s.connect((host, int(port)))
            s.close()
            result = True
        except Exception as e:
            if e == socket.errno.ECONNREFUSED:
                result = True

        if result == False and tries < max_tries:
            return HostChecker.tcp(host, port, timeout, tries + 1)

        return result

    def notify(self, name, result):

        if result:
            message = "Host is online: %s" % (name)
        else:
            message = "Host is down: %s" % (name)

        notify(message)

    def loop(self):
        while True:
            for name in self.addresses:

                result = HostChecker.tcp(self.addresses[name]["host"], self.addresses[name]["port"])

                if name in self.last_state and self.last_state[name] != result:
                    self.notify(name, result)

                self.last_state[name] = result
                publish(PUBLISH_TOPIC_HOSTS % name, result)

            time.sleep(self.sleep)

class DeviceChecker:
    state = {}
    devices = {}
    sleep = 20
    tdiff = 20
    last_state = {}
    last_voltage = {}

    def __init__(self, prefix):
        self.devices = self.parse_devices(prefix)

        s = threading.Thread(target = self.loop)
        s.daemon = True
        s.start()

    def parse_devices(self, prefix):
        it = 0
        result = {}

        while "%s_%i" % (prefix, it) in os.environ:
            name, url = os.environ["%s_%i" % (prefix, it)].split(",")

            device, controls = url.split(":")
            if ("|" in controls):
                control, voltage = controls.split("|")
            else:
                control = controls
                voltage = ""

            result[device] = {
                "name": name,
                "control": control,
                "voltage": voltage
            }
            it += 1

        return result

    def on_connect(self, client, userdata, rc):
        if rc != 0:
            return

        client.subscribe(SUBSCRIBE_TOPIC)
        for device in self.devices:
            if self.devices[device]["voltage"]:
                client.subscribe("/devices/%s/controls/%s" % (device, self.devices[device]["voltage"]))

    def on_message(self, client, userdata, msg):

        parts = msg.topic.split("/")
        device = parts[2]
        control = parts[4]


        if device in self.devices:
            if self.devices[device]["control"] == control:
                if msg.payload == b"r":
                    self.state[device] = time.time()
                elif device in self.state:
                    del self.state[device]
            elif self.devices[device]["voltage"] == control:
                self.state[device] = time.time()


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
                    self.notify(self.devices[key]["name"], value)

                self.last_state[key] = value

                publish(PUBLISH_TOPIC_DEVICES % self.devices[key]["name"], value)

            time.sleep(self.sleep)

def publish(topic, result):
    client.publish(topic, 1 if result else 0, 0, True)


def main():
    try:
        hc = HostChecker("HOST_CHECKER")
        dc = DeviceChecker("DEVICE_CHECKER")

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
