#!/bin/bash

CURRENT=$(date +%s)
WB=$(mosquitto_sub -C 1 -t /devices/util/controls/Alive)
DIFF=180

if [ $(($CURRENT-$WB)) -gt $DIFF ]; then
    echo "`date`: wb-rules hung up, restarting..."
    systemctl restart wb-rules
fi

