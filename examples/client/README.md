# Cloud CLI Application

Application that provides a CLI to the KNoT Cloud.

## How to setup Meshblu fog on local machine

This tutorial configures the knot-cloud-source as KNoT fog and uses
knot-test.cesar.org.br as cloud service.

1. Create the user by making a POST request to `/devices/user` on the cloud.

2. Create the gateway by making a POST request to `/devices` on the cloud. In
this request pass gateway as the device type and the user UUID returned in the
previous step as the device owner, like the example showed below:

```json
{
  "type": "gateway",
  "owner": <user UUID>
}
```

3. In `knot-cloud-source/config.js`, replace `uuid`, `token` and
`knotCloudUuid` with the gateway credentials you just received in the step 2.

```
parentConnection: {
  uuid: <gateway UUID>,
  token: <gateway Token>,
  server: 'knot-test.cesar.org.br',
  port: 3000
  knotCloudUuid: '<gateway UUID>'
}
```

4. Install all dependencies, running:

> `npm install`

5. Then, run the cloud:

> `node server.js --http`

## How to use CLI Application

Change to directory `examples/client` and create a file named
`config/local.json` with your cloud configurations. Following there is an
example of its contents:

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

If you run without this config file you can set the cloud configurations using
the following options:

```
--server or -s
--port or -p
--uuid or -u
--token or -t
```

NOTE: If you run `cli.js` on a gateway you don't need to create a
`config/local.json` but you need to set the option -s to the cloud.

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

With the return of command above use `getdata` and `data` to see the data
stored on cloud:
```bash
node cli.js getdata 3a14a87f-45ac-4c1c-8620-0e6c31520007 1
```
The command above are requesting data to sensor with ID 1 from thing `3a14a87f-45ac-4c1c-8620-0e6c31520007`

```bash
node cli.js data 3a14a87f-45ac-4c1c-8620-0e6c31520007
```

And the command above return the list of data from thing
`3a14a87f-45ac-4c1c-8620-0e6c31520007`

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

Create a subscription to a device's messages using the command below.

```bash
node cli.js subscribe 3a14a87f-45ac-4c1c-8620-0e6c31520007
```

To limit subscriptions, you can pass the option --type with one or more
subscription types. If none is specified, the CLI takes `sent` type as default.

There are three types:

- broadcast: broadcast messages sent by the device and messages the device
  receives.
- received: messages received by the device.
- sent: messages sent by the device.

An example of limited subscription is shown below.

```bash
node cli.js subscribe 3a14a87f-45ac-4c1c-8620-0e6c31520007 --type received sent
```