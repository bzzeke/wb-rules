#!/bin/sh

LOG="/opt/g.log"
NUMBER="+79297992345"

# Check for sender number
if [ "$SMS_1_NUMBER" != $NUMBER ] ; then
    exit
fi



# Handle commands
case "$SMS_1_TEXT" in
    "reboot")
	out=$(ssh -i /opt/mikrotik shell@192.168.34.1 "/system reboot" 2>&1)
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
	gam=$(gammu-smsd-inject TEXT $NUMBER -text "$res" 2>&1)
	echo $gam >> $LOG

        ;;
    "stats")
	echo "stats" >> /opt/g.log
        ;;
esac