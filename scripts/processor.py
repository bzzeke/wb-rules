import subprocess
import json
import os
import util
from client import send_sms

class Processor():
    def __log(self, text):
        with open(os.environ['SMSD_LOG'], 'a') as file:
            file.write(text + '\n')

    def __send(self, text):
        return send_sms(os.environ['PHONE'], text)

    def reboot(self):
        try:
            output = subprocess.check_output('ssh -i %s %s "/system reboot"' % (os.environ['MIKROTIK_KEY'], os.environ['MIKROTIK_URL']), stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as exc:
            text = 'Failed to reboot [%s %s]' % (output.decode(), exc.output.decode())
        else:
            text = 'Rebooted successfuly [%s]' % (output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def ping(self):
        text = 'pong'
        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def reboot_switch(self):
        try:
            output = subprocess.check_output('%s/unify.py reboot' % (os.path.dirname(os.path.realpath(__file__))), stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as exc:
            text = 'Failed to reboot switch [%s]' % (exc.output.decode())
        else:
            text = 'Switch rebooted successfuly [%s]' % (output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def switch_ports(self):
        try:
            output = subprocess.check_output('%s/unify.py switch_ports' % (os.path.dirname(os.path.realpath(__file__))), stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as exc:
            text = 'Failed to switch ports [%s]' % (exc.output.decode())
        else:
            text = 'Ports switched successfuly [%s]' % (output.decode())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")