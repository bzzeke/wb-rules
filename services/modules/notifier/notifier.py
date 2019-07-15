#!/usr/bin/python3
import sys
import getopt
import util
import os
from datetime import datetime
import asyncore
from smtpd import SMTPServer
import smtplib
from modules.monitoring.monitoring import HostChecker

class EmlServer(SMTPServer):
    no = 0
    def process_message(self, peer, mailfrom, rcpttos, data):
        message = smtplib.email.message_from_string(data)
        result = HostChecker.tcp(os.environ["NOTIFYING_MAIL_SERVER"], 25)
        if result:
            self.forward(message)
        else:
            util.send_sms(os.environ["PHONE"], message.get_payload())

    def forward(self, message):
        try:
            s = smtplib.SMTP(os.environ["NOTIFYING_MAIL_SERVER"], 25)
            s.send_message(message)
            s.quit()
        except smtplib.SMTPException as e:
            util.prnt("[notifier] Unable to send email, %s" % e.errno, util.LOG_ERR)

def main():

    EmlServer(("0.0.0.0", 25), None)
    util.prnt("[notifier] Starting...")
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        pass
