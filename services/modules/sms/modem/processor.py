import subprocess
import json
import os
import util
import contextlib
import io
import modules.unify.unify as unify
import requests
import urllib3
urllib3.disable_warnings()

from datetime import datetime

class Processor():
    def __log(self, text):
        with open(os.environ['SMSD_LOG'], 'a') as file:
            time_string = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            file.write(time_string + " " + text + '\n')
            util.prnt("[processor] " + text)

    def __send(self, text):
        status = util.send_sms(os.environ['PHONE'], text)
        status_msg = "[Sent]" if status else "[Failed]"
        self.__log(status_msg + '\n' + text)

    def reboot(self):
        try:
            s = requests.Session()
            r = s.post(os.environ["ROUTER_URL"], data={"username": os.environ["ROUTER_USER"], "password": os.environ["ROUTER_PASSWORD"]}, verify=False)
            r = s.post("{}/api/edge/operation/reboot.json".format(os.environ["ROUTER_URL"]), headers={"X-CSRF-TOKEN": s.cookies['X-CSRF-TOKEN']})

            text = "Rebooted successfuly [{}]".format(r.text)
        except Exception as exc:
            text = "Failed to reboot [{}]".format(str(exc))

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
