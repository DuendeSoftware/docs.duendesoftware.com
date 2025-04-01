---
title: "Device Authorization Endpoint"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 8
---

The device authorization endpoint can be used to request device and user codes.
This endpoint is used to start the device flow authorization process.

* **`client_id`**

  client identifier (required)

* **`client_secret`**

  client secret either in the post body, or as a basic authentication header. Optional.

* **`scope`**

  one or more registered scopes. If not specified, a token for all explicitly allowed scopes will be issued

```text
POST /connect/deviceauthorization

    client_id=client1&
    client_secret=secret&
    scope=openid api1
```

## .NET client library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestDeviceAuthorizationAsync(new DeviceAuthorizationRequest
{
    Address = "https://demo.duendesoftware.com/connect/device_authorize",
    ClientId = "device"
});
```