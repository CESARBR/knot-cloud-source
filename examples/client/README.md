# Cloud CLI Application

Application that provides a CLI to the KNoT Cloud.

## How to

To show a list of available commands:
> `node client/cli.js -h`

To get the things from your gateways use:
> `node client/cli.js -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b devices`

With the return of command above use `get-data` and `data` to see the data stored on cloud:
> `node client/cli.js -s 172.24.15.213  -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b get-data 3a14a87f-45ac-4c1c-8620-0e6c31520007 1`

The command above are requesting data to sensor with ID 1 from thing `3a14a87f-45ac-4c1c-8620-0e6c31520007`

> `node client/cli.js -s 172.24.15.213  -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b data 3a14a87f-45ac-4c1c-8620-0e6c31520007 1`

And the command above return the list of data from sensor 1

You can set the data too:
> `node client/cli.js -s 172.24.15.213  -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b set-data 3a14a87f-45ac-4c1c-8620-0e6c31520007 1 true`

You can even update the thing's config:
> `node client/cli.js -s 172.24.15.213  -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b config 3a14a87f-45ac-4c1c-8620-0e6c31520007 1 true`

The default config being sent is:
```json
"config":[{
    "event_flags": 8,
    "time_sec": 0,
    "lower_limit": 0,
    "upper_limit": 0
}]
```
but you can change it by using the options:
```
--event-flag or -f
--time or -T
--lower-limit or -l
--upper-limit or -L
```
 available in application

 as an example you can change the config to send sensor data each 10 seconds

> `node client/cli.js -s 172.24.15.213  -u a585b687-1166-4dab-a4e8-5654274f0000 -t 9d9e193c7bb3f8c1c45e28524f2d5cc353bcbe4b config 3a14a87f-45ac-4c1c-8620-0e6c31520007 1 true -f 1 -T 10`
