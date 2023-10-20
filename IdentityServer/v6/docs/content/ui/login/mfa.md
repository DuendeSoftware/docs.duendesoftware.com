---
title: "Multi Factor Authentication"
weight: 50
---

# Multi Factor Authentication

IdentityServer itself doesn't implement MFA. MFA is part of the login which is the [responsibility of the hosting application]({{< ref "..">}}).

## MFA hosted in IdentityServer
To make the local IdentityServer login page offer MFA anything that works with Asp.Net Core also works with IdentityServer. One approach is to use [Microsoft Asp.Net Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity) that offers [MFA support](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-enable-qrcodes).

## MFA and external authentication
When using Duende IdentityServer as a [federation gateway](../../federation) the user authentication is done on the upstream provider. It is common to let the upstream provider deal with the entire user authentication, including any MFA required. There's no special configuration or implementation needed on IdentityServer in this case, as the upstream provider handles everyting.