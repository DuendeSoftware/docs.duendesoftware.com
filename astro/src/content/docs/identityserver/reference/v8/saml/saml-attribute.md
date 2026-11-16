---
title: "SAML Attribute"
description: "Reference for SamlAttribute and ProfileDataRequestContext.SamlAttributes, which let a profile service add SAML attributes to assertions."
date: 2026-11-16
sidebar:
  label: "SAML Attribute"
  order: 16
---

## Duende.IdentityServer.Saml.SamlAttribute

A SAML attribute included in the assertion's attribute statement.

| Property | Description |
|---|---|
| `Name` | The attribute name (`string`). |
| `NameFormat` | The attribute name format URI (`string?`). |
| `FriendlyName` | The human-readable friendly name (`string?`). |
| `Values` | The attribute values (`List<string?>`). |

## ProfileDataRequestContext.SamlAttributes

When the SAML response is built, `IProfileService.GetProfileDataAsync` receives a `ProfileDataRequestContext` that has a `SamlAttributes` property (`List<SamlAttribute>`). Attributes added there are merged with the attributes mapped from claims; when the `Name` matches, the values are appended.

For this request, the context has:

| Property | Value |
|---|---|
| `Caller` | The string `"Saml2SsoResponseGenerator"` |
| `Application` | The `SamlServiceProvider` (an `IConnectedApplication` whose `ProtocolType` is `saml2p`) |
| `ProtocolRequest` | The `ValidatedAuthnRequest` |
| `RequestedClaimTypes` | The claim types resolved for the SP |

`IsActiveAsync` is called with the caller `SamlSsoEndpoint` and the SP as the application.

```csharp
public Task GetProfileDataAsync(ProfileDataRequestContext context, CancellationToken ct)
{
    if (context.Application is SamlServiceProvider)
    {
        context.SamlAttributes.Add(new SamlAttribute
        {
            Name = "department",
            Values = { "engineering" }
        });
    }

    return Task.CompletedTask;
}
```
