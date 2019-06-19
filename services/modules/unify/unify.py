#!/usr/bin/python3
import json
import os
import urllib.request
import ssl
import time
import getopt
import sys

ssl._create_default_https_context = ssl._create_unverified_context

def req(method, endpoint, data, headers = {}):
    base_url = "https://%s/" % (os.environ["SWITCH_HOST"])
    url = "%s%s" % (base_url, endpoint)

    headers = {
        "Content-Type": "application/json",
        "Referer": base_url,
        **headers
    }

    if method == "GET":
        req = urllib.request.Request(url, headers=headers, method=method)
    else:
        params = json.dumps(data).encode("utf8")
        req = urllib.request.Request(url, data=params,
                                headers=headers, method=method)
    try: response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        print(str(e))
        response = e
    except urllib.error.URLError as e:
        print(str(e))
        response = e

    return response

def switch_ports():
    ports = os.environ["SWITCH_PORTS"].split(",")
    token = auth()
    resp = req("GET", "api/v1.0/interfaces", {}, {"x-auth-token": token})

    if resp.getcode() == 200:
        interfaces = json.loads(resp.read().decode("utf-8"))
        for interface in interfaces:
            if interface["identification"]["id"] in ports:
                original_status = interface["port"]["poe"]
                interface["port"]["poe"] = "off"
                resp = req("PUT", "api/v1.0/interfaces", interface, {"x-auth-token": token})
                if resp.getcode() == 200:
                    time.sleep(5)
                    interface["port"]["poe"] = original_status
                    resp = req("PUT", "api/v1.0/interfaces", interface, {"x-auth-token": token})
                    if resp.getcode() == 200:
                        print("Switched POE for port %s successfully" % (interface["identification"]["id"]))
                        return True

                    print("Failed to get POE back for port %s" % (interface["identification"]["id"]))
                    return False
                else:
                    print("Failed to switch POE off for port %s" % (interface["identification"]["id"]))
                    return False
    else:
        print("Failed to get interfaces list")

    return False

def reboot():
    token = auth()

    resp = req("GET", "api/v1.0/system/reboot", {}, {"x-auth-token": token})
    if resp.getcode() == 200:
        print("Rebooted successfully")
        return True

    print("Failed to reboot")
    return False

def parse_options():

    try:
        opts, args = getopt.getopt(sys.argv[2:], "c:")
    except Exception as e:
        opts = []

    if (not opts):
        print("dio unify -c <command>")
        sys.exit(1)

    return opts[0][1]

def auth():
    token = ""
    resp = req("POST", "api/v1.0/user/login", {
        "username": os.environ["SWITCH_USERNAME"],
        "password": os.environ["SWITCH_PASSWORD"]
    })

    if resp.getcode() == 200:
        headers = dict(resp.info())
        if "x-auth-token" in headers:
            token = headers["x-auth-token"]
        else:
            print("Failed to get auth token from headers")
    else:
        print("Failed to authenticate")

    return token


def main():

    cmd = parse_options()
    if cmd == "switch_ports":
        switch_ports()
    elif cmd == "reboot":
        reboot()

