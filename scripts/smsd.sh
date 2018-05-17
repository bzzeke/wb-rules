#!/bin/sh

. /etc/wb-rules/scripts/.env

LOG="/etc/wb-rules/scripts/log/gammu.log"

# Check for sender number
if [ "$SMS_1_NUMBER" != $PHONE ] ; then
    exit
fi



# Handle commands
case "$SMS_1_TEXT" in
    "reboot")
	out=$(ssh -i /etc/wb-rules/scripts/keys/mikrotik shell@$MIKROTIK_HOST "/system reboot" 2>&1)
	ret="$?"
	case $ret in
	0)
	    res="Rebooted successfuly [$out]"
	    ;;
	1)
	    res="Failed to reboot [$out]"
	    ;;
	*)
	    res="Other problem [$out]"
	    ;;
	esac
	
	echo $res >> $LOG
	gam=$(gammu-smsd-inject TEXT $PHONE -text "$res" 2>&1)
	echo $gam >> $LOG

        ;;
    "stats")
	echo "stats" >> $LOG
        ;;
esac