---
title: "Multi Factor Authentication"
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/ui/login/mfa/
  - /identityserver/v6/ui/login/mfa/
  - /identityserver/v7/ui/login/mfa/
---

Duende IdentityServer itself doesn't implement multi-factor authentication (MFA). MFA is part of the login process in the user interface which is the [responsibility of the hosting application](..). Microsoft provides some [general guidelines](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/mfa) on how to enable MFA in ASP.NET Core.

## MFA hosted in IdentityServer
An IdentityServer implementation can include MFA in its login page using anything that works with ASP.NET Core. One approach is to use [ASP.NET Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity)'s [MFA support](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-enable-qrcodes).

## MFA and external authentication
When using IdentityServer as a [federation gateway](/identityserver/ui/federation), interactive users authenticate at the upstream provider. Typically, the upstream provider will perform the entire user authentication process, including any MFA required. There's no special configuration or implementation needed in IdentityServer in this case, as the upstream provider handles everything.