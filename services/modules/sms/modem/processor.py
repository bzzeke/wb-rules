import subprocess
import json
import os
import util
import contextlib
import io
import modules.unify.unify as unify
from datetime import datetime

class Processor():
    def __log(self, text):
        with open(os.environ['SMSD_LOG'], 'a') as file:
            time_string = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            file.write(time_string + " " + text + '\n')

    def __send(self, text):
        status = util.send_sms(os.environ['PHONE'], text)
        status_msg = "[Sent]" if status else "[Failed]"
        self.__log(status_msg + '\n' + text)

    def reboot(self):
        try:
            output = subprocess.check_output('ssh -i {} {} "/system reboot"'.format(os.environ['MIKROTIK_KEY'], os.environ['MIKROTIK_URL']), stderr=subprocess.STDOUT, shell=True)
            text = "Rebooted successfuly [{}]".format(output.decode())
        except subprocess.CalledProcessError as exc:
            text = "Failed to reboot [{}]".format(exc.output.decode())

        self.__send(text)

    def ping(self):
        text = 'pong'
        self.__send(text)

    def reboot_switch(self):

        result = False
        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            result = unify.reboot()

        if (result):
            text = "Switch rebooted successfuly [{}]".format(f.getvalue())
        else:
            text = "Failed to reboot switch [{}]".format(f.getvalue())

        self.__send(text)

    def switch_ports(self):

        result = False
        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            result = unify.switch_ports()

        if (result):
            text = "Ports switched successfuly [{}]".format(f.getvalue())
        else:
            text = "Failed to switch ports [{}]".format(f.getvalue())


        self.__send(text)