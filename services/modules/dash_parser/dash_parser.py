#!/usr/bin/python3

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

class Server(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/json')
        self.end_headers()

    def do_GET(self):
        self._set_headers()
        self.wfile.write(json.dumps(getwidgets()).encode("utf-8"))

def cell_get_type(cell):
    if cell["type"] in ["temperature", "text", "rel_humidity", "concentration", "voltage", "value", "power", "power_consumption"]:
        return "text"
    elif cell["type"] == "switch":
        if cell["extra"] and cell["extra"]["format"] and cell["extra"]["format"] == "checkbox":
            return "text"
        else:
            return "switch"
    elif cell["type"] == "range":
        return "slider"

def cell_get_format(cell):

    if cell["extra"] and cell["extra"]["format"]:
        return cell["extra"]["format"]

    if cell["type"] == "temperature":
        return "temperature"
    elif cell["type"] == "rel_humidity":
        return "humidity"
    elif cell["type"] == "voltage":
        return "voltage"
    elif cell["type"] == "power":
        return "power"
    elif cell["type"] == "power_consumption":
        return "energy"
    elif cell["type"] == "concentration":
        return "ppm"
    elif cell["type"] == "value":
        return "current"

    return ""


def cell_get_status_topic(id):
    device, cell = id.split("/")
    return "/devices/%s/controls/%s" % (device, cell)

def cell_get_payload_topic(id):
    status = cell_get_status_topic(id)
    return "%s/on" % (status)

def cell_get_name(cell):
    if "name" in cell:
        return cell["name"]

    device, cell = cell["id"].split("/")
    return cell

def cell_get_range_data(control, cell):
    control["min"] = 0
    control["max"] = 100
    control["scale"] = 1

    if cell["extra"]:
        if cell["extra"]["min"]:
            control["min"] = cell["extra"]["min"]

        if cell["extra"]["max"]:
            control["max"] = cell["extra"]["max"]

        if cell["extra"]["scale"]:
            control["scale"] = cell["extra"]["scale"]

    return control

def getwidgets():

    widgets = []
    with open(os.environ["DASH_CONFIG"], 'r') as f:
        webui = json.load(f)

    if webui:
        for webui_widget in webui["widgets"]:
            widget = {
                "title": webui_widget["name"],
                "controls": []
            }

            for cell in webui_widget["cells"]:
                control = {
                    "title": cell_get_name(cell),
                    "type": cell_get_type(cell),
                    "status": cell_get_status_topic(cell["id"])
                }

                if control["type"] != "switch":
                    control["format"] = cell_get_format(cell)

                if control["type"] in ["slider", "switch"]:
                    control["payload"] = cell_get_payload_topic(cell["id"])

                if control["type"] == "slider":
                    control = cell_get_range_data(control, cell)

                widget["controls"].append(control)

            widgets.append(widget)

    return widgets

def main():
    server_address = ('', int(os.environ["DASH_PORT"]))
    httpd = HTTPServer(server_address, Server)
    print('Dash parser, starting...')
    httpd.serve_forever()

