import subprocess
import json
import os
import util
import contextlib
import io
import modules.unify.unify as unify

class Processor():
    def __log(self, text):
        with open(os.environ['SMSD_LOG'], 'a') as file:
            file.write(text + '\n')

    def __send(self, text):
        return util.send_sms(os.environ['PHONE'], text)

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

        result = False
        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            result = unify.reboot()

        if (result):
            text = "Switch rebooted successfuly [{}]".format(f.getvalue())
        else:
            text = "Failed to reboot switch [{}]".format(f.getvalue())

        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")

    def switch_ports(self):

        result = False
        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            result = unify.switch_ports()

        if (result):
            text = "Ports switched successfuly [{}]".format(f.getvalue())
        else:
            text = "Failed to switch ports [{}]".format(f.getvalue())


        self.__log(text)
        self.__log("Sent" if self.__send(text) else "Failed")