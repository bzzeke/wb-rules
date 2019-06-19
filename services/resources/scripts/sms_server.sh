#!/bin/bash
wb-gsm restart_if_broken
/etc/wb-rules/services/dio sms_server -d /dev/ttyGSM
