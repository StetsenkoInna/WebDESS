# WebDESS
v1.0.0 Dec 22, 2019

Petri chart modeling tool.

1. Install **node** v10+, **yarn**, **pm2** and **postgres** 10+.
1. Create database **webdess** for project.
1. Create empty dir **src/files**.
1. Create **process.yml** config file. Read **Config** part.
1. Use **db/config.sql** as database configuration file.
1. Install packages and start.
```
yarn
yarn start
```
5. Stop and Restart tools
```
yarn stop
yarn restart
```
6. Logs and Errors tools
```
yarn logs
yarn errors
```

## Config

Use **process.yml** config.

```
---
name            : webdess-server
script          : server.js
log_date_format : YYYY-MM-DD HH:mm:ss Z
error_file      : logs/node-app.stderr.log
out_file        : logs/node-app.stdout.log
pid_file        : pids/webdess.pid
instances       : '1'
watch           : false
merge_logs      : true
autorestart     : true
env:
  NODE_ENV      : development
  NODE_URL      : localhost
  NODE_PORT     : 4000
  PG_HOST       : 127.0.0.1                         # Postgres host
  PG_USER       : postgres                          # Postgres user
  PG_PORT       : 5432                              # Postgres port
  PG_PASS       : pass1234                          # Postgres password
  PG_DB         : webdess                           # Postgres database
```

Powered by DenyStark.
