#!/bin/bash
. /etc/wb-rules/scripts/.env

HEADER="To: $NOTIFY_EMAIL
From: $FROM_EMAIL
Subject: Home Mode
"

H_ON="$HEADER
System is now in Home Mode
"

H_OFF="$HEADER
System has left Home Mode
"

if [ "$1" == "on" ]; then
TPL="$H_ON"
else
TPL="$H_OFF"
fi

printf "$TPL" | ssmtp notify@ilyashalnev.com
