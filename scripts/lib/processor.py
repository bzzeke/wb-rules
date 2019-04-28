import subprocess
import json
import os
import lib.util
from client import send_sms

class Processor():
    def __log(self, text):
        with open(os.environ['SMSD_LOG'], 'a') as file:
            file.write(text + '\n')

    def __send(self, text):
        return send_sms(os.environ['PHONE'], text)

    def reboot(self):
        try:
            output = subprocess.check_output('ssh -i {} {} "/system reboot"'.format(os.environ['MIKROTIK_KEY'], os.environ['MIKROTIK_URL']), stderr=subprocess.STDOUT, shell=True)
            text = "Rebooted successfuly [{}]".format(output.decode())
        except subprocess.CalledProcessError as exc:
            text = "Failed to reboot [{}]".format(exc.output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def ping(self):
        text = 'pong'
        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def reboot_switch(self):
        try:
            output = subprocess.check_output("{}/unify.py reboot".format(lib.util.getRoot()), stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as exc:
            text = "Failed to reboot switch [{}]".format(exc.output.decode())
        else:
            text = "Switch rebooted successfuly [{}]".format(output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def switch_ports(self):
        try:
            output = subprocess.check_output("{}/unify.py switch_ports".format(lib.util.getRoot()), stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as exc:
            text = "Failed to switch ports [{}]".format(exc.output.decode())
        else:
            text = "Ports switched successfuly [{}]".format(output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")