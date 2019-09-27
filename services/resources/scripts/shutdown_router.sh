#!/bin/bash
MIKROTIK_KEY=$(grep MIKROTIK_KEY /etc/wb-rules/services/.env | cut -d '=' -f2)
MIKROTIK_URL=$(grep MIKROTIK_URL /etc/wb-rules/services/.env | cut -d '=' -f2)
ssh -o "StrictHostKeyChecking no" -i $MIKROTIK_KEY $MIKROTIK_URL "/system shutdown"