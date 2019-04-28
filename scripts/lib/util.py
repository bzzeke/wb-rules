import os, sys, inspect


filepath = os.path.dirname(os.path.realpath(__file__)) + '/../.env'
with open(filepath) as fp:
    for cnt, line in enumerate(fp):
        parts = line.split('=', 2)
        if len(parts) == 2:
            os.environ[parts[0].strip()] = parts[1].strip()

def getRoot():
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