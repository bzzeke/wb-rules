#!/bin/bash
wb-gsm restart_if_broken
/etc/wb-rules/scripts/server.py -d /dev/ttyGSM
