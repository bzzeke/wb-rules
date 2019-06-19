import os, sys, inspect, subprocess, socket, json, syslog

def get_root():
    for teil in inspect.stack():
        if teil[1].startswith("<"):
            continue
        if teil[1].upper().startswith(sys.exec_prefix.upper()):
            continue
        trc = teil[1]

    if getattr(sys, 'frozen', False):
        scriptdir, scriptname = os.path.split(sys.executable)
        return scriptdir

    scriptdir, trc = os.path.split(trc)
    if not scriptdir:
        scriptdir = os.getcwd()

    return scriptdir

def send_email(text):

    header = """To: %s
    From: %s
    Subject: Notify
    """ % (os.environ['NOTIFY_EMAIL'], os.environ['FROM_EMAIL'])

    message = """%s
    %s
    """ % (header, text)

    res = subprocess.Popen(['ssmtp', os.environ['NOTIFY_EMAIL']], stdin=subprocess.PIPE)
    res.communicate(input=str.encode(text))[0]

def send_sms(number, text):
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        sock.connect(os.environ["SMS_SOCKET_NAME"])
        sock.sendall(json.dumps({
            "number": number,
            "text": text
        }).encode('utf-8'))
        data = sock.recv(1024)
        if (data == b"OK"):
            syslog.syslog("DIO-SMS client: message was put to queue")
            return True

        syslog.syslog(syslog.LOG_ERR, "DIO-SMS client: message was not put to queue")
    except Exception as e:
        syslog.syslog(syslog.LOG_ERR, "DIO-SMS client: %s" %e)
        raise

    return False

def import_env():
    filepath = os.path.dirname(os.path.realpath(__file__)) + '/.env'
    with open(filepath) as fp:
        for cnt, line in enumerate(fp):
            parts = line.split('=', 2)
            if len(parts) == 2:
                os.environ[parts[0].strip()] = parts[1].strip()
