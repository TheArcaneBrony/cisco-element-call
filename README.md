# Element Call on RoomOS

A macro to integrate Element Call in RoomOS.

---

**_NOTE:_** a nix shell environment is included for your convenience, run `nix `

How to build:

```shell
npm run build
# Copy dist/module.js into a macro, save and activate
```

How to test:

```shell
# Create .env:
# ROOMKIT_URL=wss://someaddress/
# ROOMKIT_USER=user
# ROOMKIT_PASS=password
npm run dev
```
