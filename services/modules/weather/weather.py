#!/usr/bin/python3
import json
import os
import urllib.request
import util

def req(url, headers = {}):

    headers = {
        "Content-Type": "application/json",
        **headers
    }

    req = urllib.request.Request(url, headers=headers, method="GET")

    try:
        response = urllib.request.urlopen(req, None, 2)

        if response.getcode() == 200:
            return json.loads(response.read().decode("utf-8"))

    except urllib.error.HTTPError as e:
        util.prnt("[weather] %s" % str(e), util.LOG_ERR)
        response = str(e)
    except urllib.error.URLError as e:
        util.prnt("[weather] %s" % str(e), util.LOG_ERR)
        response = str(e)

    return {
        "error": response
    }

def main():

    result = {
        "air_quality": 0,
        "wind": 0,
        "wind_direction": "",
        "temperature": 0
    }

    url = "https://api.waqi.info/feed/%s/?token=%s" % (os.environ["AQ_CITY"], os.environ["AQ_API_KEY"])
    resp = req(url)

    if "data" in resp:
        result["air_quality"] = resp["data"]["aqi"]

    url = "https://api.checkwx.com/metar/%s/decoded/" % (os.environ["WEATHER_AIRPORT"])
    resp = req(url, {"X-API-Key": os.environ["WEATHER_API_KEY"]})

    if "data" in resp:
        result["wind"] = resp["data"][0]["wind"]["speed_mps"]
        result["wind_direction"] = resp["data"][0]["wind"]["degrees"]
        result["temperature"] = resp["data"][0]["temperature"]["celsius"]

    print(json.dumps(result))
