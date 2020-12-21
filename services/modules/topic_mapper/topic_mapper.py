import os
import mosquitto as mqtt
import sys
from util import prnt

class Translator():

    client = None
    mapping = {}
    devices = {}

    def __init__(self, client=None):
        self.client = client
        self.generate_mapping()

    def generate_mapping(self):
        it = 0
        while "TOPIC_MAPPING_{}".format(it) in os.environ:
            parts = os.environ["TOPIC_MAPPING_{}".format(it)].split(",")
            self.mapping[parts[2]] = "{}/controls/{}".format(parts[0], parts[3])
            self.devices[parts[0]] = parts[1]
            it += 1

    def subscribe_topics(self):
        topics = [
            ("/sonoff/stat/+/+", 0)
        ]

        for device in self.devices:
            topics.append(("/devices/{}/controls/+/on".format(device), 0))

        return topics

    def on_connect(self, client, userdata, rc):
        if rc != 0:
            return

        self.client.subscribe(self.subscribe_topics())
        self.publish_devices()
        self.publish_meta()

    def publish_devices(self):
        for device, name in self.devices.items():
            self.client.publish("/devices/{}/meta/name".format(device), name, retain=True)

    def publish_meta(self):
        for (sonoff, control) in self.mapping.items():
            self.client.publish("/devices/{}/meta/type".format(control), "switch", retain=True)

    def on_message(self, client, userdata, msg):

        if msg.topic.startswith("/sonoff"):
            self.from_sonoff(msg)
        else:
            self.to_sonoff(msg)

    def from_sonoff(self, msg):
        parts = msg.topic.split("/")
        control = self.mapping.get("{}/{}".format(parts[3], parts[4]))
        if not control:
            return
        value = 0 if msg.payload == b"OFF" else 1

        self.client.publish("/devices/{}".format(control), value, retain=True)

    def to_sonoff(self, msg):
        parts = msg.topic.split("/")
        control = "{}/controls/{}".format(parts[2], parts[4])

        for (key, value) in self.mapping.items():
            if value == control:
                self.client.publish("/sonoff/cmnd/{}".format(key), "ON" if msg.payload == b"1" else "OFF")
                break

def main():

    client = mqtt.Mosquitto()
    translator = Translator(client=client)

    client.on_connect = translator.on_connect
    client.on_message = translator.on_message

    client.connect(os.environ["MQTT_HOST"], int(os.environ["MQTT_PORT"]), 10)
    prnt("[topic_mapper] Starting...")
    while True:
        rc = client.loop()
        if rc != 0:
            break
