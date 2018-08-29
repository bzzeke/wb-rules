#!/bin/bash
PHONE=$3
MESSAGE=$(cat)

gammu-smsd-inject TEXT $PHONE -text "$MESSAGE" -unicode
