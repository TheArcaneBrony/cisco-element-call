# I got one of these from EBay, how to update?

---

Obtain these files:

- `s53200ce9.15.6-step-upgrade.pkg`
- `cmterm-s53200ce10_11_2_2.k3.cop.sgn`

Apply these in order, this will bring your device to RoomOS 10.11.2.

From here, register with a free WebEx account, let the device download the latest RoomOS 11.x build, it will automatically reboot.
You can upload the files through the web interface -> software

Hint: To keep admin/other accounts active: `xCommand Webex Registration Start SecurityAction: NoAction ActivationCode: "123456"`

TODO: investigate https://$ROOKIT_IP/web/logs/file/current/eventlog/softwareupgrade.log to get unauthenticated pkg files
