#!/bin/bash
. /etc/wb-rules/scripts/.env

SYNO="$SYNOLOGY_HOST:$SYNOLOGY_PORT"
on=$1

echo -n "Authenticating to API ... "
SID=`wget -qO - "$SYNO/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account=$SYNOLOGY_USER&passwd=$SYNOLOGY_PASSWORD&session=SurveillanceStation&format=sid" | grep 'sid' | awk -F '"' '{print $6}'`

if [ "$SID" != "" ]; then
    echo "ok"
    RESULT=`wget -qO - "$SYNO/webapi/entry.cgi?api=SYNO.SurveillanceStation.HomeMode&version=1&method=Switch&on=$on&_sid=$SID" | grep '"success":true'`

    if [ "$RESULT" != "" ]; then
        echo "ok"
    else
        echo "fail"
    fi

    echo -n "Logging out of API ... "
    wget -qO - "$SYNO/webapi/auth.cgi?api=SYNO.API.Auth&version=1&method=logout&session=SurveillanceStation" > /dev/null
    echo "done."
else
    echo "fail"
fi
