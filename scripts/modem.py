import serial
import time
import datetime
import syslog
import os
from curses import ascii
from pdu import decodeSmsPdu, encodeSmsSubmitPdu
from processor import Processor
import re

class Modem():
    port_speed = 115200
    timeout = 5
    smsc = ""
    max_reads = 20
    port = False

    def __init__(self, device):
        try:
            self.port = serial.Serial(device, self.port_speed, timeout = self.timeout)
            if (self.port.isOpen()):
                self.flushBuffer()
                if (not self.init()):
                    raise Exception("Failed to init modem")

        except serial.SerialException as e:
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to open modem, %s" % e)
            raise

    def isOpen(self):
        return self.port.isOpen()

    def close(self):
        if self.port.isOpen():
            self.port.close()

    def check(self):
        self.port.write("AT\r")
        if (self.getResponse("OK")):
            return True

        return False

    def init(self):
        self.port.write("AT+CMGF=0\r")
        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to set PDU mode")
            return False

        self.port.write("AT+CNMI=2,1,0,0\r")
        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to set message receive notification")
            return False

        self.port.write("AT+CPMS=\"ME\",\"ME\",\"ME\"\r")
        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to set message storage")
            return False

        self.port.write("AT+CSCA?\r")
        response = self.getResponse("+CSCA:")
        if (not response):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to get SMSC number")
            return False

        m = re.search('"(.*?)"', response)
        self.smsc = m.group(1).decode('hex')

        return True

    def getResponse(self, string):
        failed = False
        reads = 0

        while True:
            status = self.port.readline()
            if (status.startswith(string)):
                break

            reads += 1
            if (reads > self.max_reads):
                failed = True
                break
            continue

        if (failed):
            return False

        return status

    def checkMessages(self):
        line = self.port.readline()

        if (line.startswith("+CMTI")):
            index = self.getMessageIndex(line)
            number, text = self.readSMS(index)
            self.deleteSMS(index)
            syslog.syslog("SMSD server: got message from %s" % number)

            if (number and number == os.environ['PHONE']):
                processor = Processor()

                if (not text.startswith("__") and hasattr(processor, text)):
                    getattr(processor, text)()

    def sendSMS(self, number, text):
        pdu = encodeSmsSubmitPdu(number, text, 0, datetime.timedelta(days=441), self.smsc, False)
        pdu_decoded = decodeSmsPdu(str(pdu[0]))

        self.port.write("AT+CMGS=%s\r" % pdu_decoded['tpdu_length'])

        if (not self.getResponse(">")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to init SMS send")
            return False

        self.port.write(str(pdu[0]))
        self.port.write(ascii.ctrl('z'))

        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to send PDU string")
            return False

        syslog.syslog("SMSD server: message sent to %s" % number)
        return True

    def deleteSMS(self, messageIndex):
        self.port.write("AT+CMGD=%s\r" % messageIndex)

        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to delete SMS")
            return False

        return True

    def readSMS(self, messageIndex):
        self.port.write("AT+CMGR=%s\r" % messageIndex)
        time.sleep(2)

        self.port.readline() # empty
        self.port.readline() # header?
        body = self.port.readline()

        if (not self.getResponse("OK")):
            syslog.syslog(syslog.LOG_ERR, "SMSD server: failed to read SMS")
            return False

        pdu_decoded = decodeSmsPdu(body.strip())
        return pdu_decoded['number'], pdu_decoded['text']

    def flushBuffer(self):
        self.port.readlines()

    def getMessageIndex(self, string):
        parts = string.strip().split(":")
        return parts[1].split(",")[1]