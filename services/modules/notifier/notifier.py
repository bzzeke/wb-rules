#!/usr/bin/python3
import sys
import getopt
import util
import os
from datetime import datetime
import asyncore
from smtpd import SMTPServer
import smtplib
from email.message import EmailMessage

class EmlServer(SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data):
        message = smtplib.email.message_from_string(data)
        message["To"] = rcpttos[0]
        message["From"] = mailfrom
        send(message)

def notify(message):

    msg = EmailMessage()
    msg.set_content(message)
    msg["Subject"] = "Alert"
    msg["From"] = os.environ["FROM_EMAIL"]
    msg["To"] = os.environ["NOTIFY_EMAIL"]
    send(msg)

def send(message):
    try:
        s = smtplib.SMTP(host=os.environ["NOTIFYING_MAIL_SERVER"], port=25, timeout=5)
        s.send_message(message)
        s.quit()
    except Exception as e:
        util.prnt("[notifier] Failed to send email, sending SMS: %s" % str(e), util.LOG_ERR)
        util.send_sms(os.environ["PHONE"], message.get_payload())

def main():

    EmlServer(("0.0.0.0", 25), None)
    util.prnt("[notifier] Starting...")
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        pass
