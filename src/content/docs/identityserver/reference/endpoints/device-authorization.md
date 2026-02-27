---
title: "Device Authorization Endpoint"
description: "Documentation for the device authorization endpoint which handles device flow authentication requests and issues device and user codes for authorization."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Device Authorization
  order: 9
redirect_from:
  - /identityserver/v5/reference/endpoints/device_authorization/
  - /identityserver/v6/reference/endpoints/device_authorization/
  - /identityserver/v7/reference/endpoints/device_authorization/
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

## .NET Client Library

You can use the [Duende IdentityModel](/identitymodel/index.mdx) client library to programmatically interact with
the protocol endpoint from .NET code.

```csharp
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestDeviceAuthorizationAsync(new DeviceAuthorizationRequest
{
    Address = "https://demo.duendesoftware.com/connect/device_authorize",
    ClientId = "device"
});
```