- Install gammu-smsd:
`apt-get install gammu-smsd`
- Copy config
- Copy private key to `/etc/wb-rules/scripts/keys/mikrotik`. Create `gammu.log` in `/etc/wb-rules/scripts/log` and chmod it to 666
- Create gammu user directory
```
mkdir -p /var/lib/gammu
chmod 700 /var/lib/gammu
chown gammu:gammu /var/lib/gammu
```
- Edit `/etc/passwd`

  - add `/var/lib/gammu` as user homedir
  - add `/bin/bash` as shell
- Log in under gammu and ssh to the mikrotik
- Replace `/bin/bash` with `/bin/false` in `/etc/passwd`
- Set gammu-smsd autostart
`update-rc.d gammu-smsd enable`

