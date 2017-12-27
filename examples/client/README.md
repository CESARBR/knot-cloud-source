# Cloud CLI Application

Application that provides a CLI to the KNoT Cloud.

## How to

Change to directory `examples/client` and create a file `config/local.json` with your cloud configurations
This is an example of a file:
```json
{
  "cloud": {
    "serverName": "localhost",
    "port": 3000,
    "uuid": "44a728ec-4be3-44ce-84e5-6c6b1c500000",
    "token": "6050d4c4d3e4782c04971f2d84d190e2d26a51ef"
  }
}
```
If you run without this config file you can set the cloud configurations with options:
```
--server or -s
--port or -p
--uuid or -u
--token or -t
```

OBS: If you run the `cli.js` on gateway you doesn't need to create a `config/local.json` but you need to set the option -s to the cloud

To show a list of available commands:
```bash
node cli.js -h
```

To create a thing in your gateway use:

```bash
node cli.js register thing1
```

To get the things from your gateways use:
```bash
node cli.js devices
```

With the return of command above use `getdata` and `data` to see the data stored on cloud:
```bash
node cli.js getdata 3a14a87f-45ac-4c1c-8620-0e6c31520007 1
```
The command above are requesting data to sensor with ID 1 from thing `3a14a87f-45ac-4c1c-8620-0e6c31520007`

```bash
node cli.js data 3a14a87f-45ac-4c1c-8620-0e6c31520007
```

And the command above return the list of data from thing `3a14a87f-45ac-4c1c-8620-0e6c31520007`

You can set the data too:
```bash
node cli.js setdata 3a14a87f-45ac-4c1c-8620-0e6c31520007 1 true
```

You can even update the thing's config:
```bash
node cli.js setconfig 3a14a87f-45ac-4c1c-8620-0e6c31520007 1
```

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

```bash
node cli.js setconfig 3a14a87f-45ac-4c1c-8620-0e6c31520007 1 -f 1 -T 10
```
