#!/bin/bash
. /etc/wb-rules/scripts/.env

if [ "$1" == "charge" ]; then
    upsc apc@$UPS_HOST | grep battery.charge: | awk '{print $2}'
elif [ "$1" == "voltage" ]; then
    upsc apc@$UPS_HOST | grep input.voltage: | awk '{print $2}'
elif [ "$1" == "status" ]; then
	upsc apc@$UPS_HOST | grep "ups.status: "| awk '{print $2}'
fi

