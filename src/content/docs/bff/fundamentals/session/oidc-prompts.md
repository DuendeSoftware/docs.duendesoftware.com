---
title: "OpenID Connect Prompts"
description: "OpenID Connect prompt support in Duende BFF V4"  
date: 2024-06-11T08:22:12+02:00
sidebar:
  label: "OIDC Prompts"
  order: 6
  badge:
    text: v4
    variant: tip
---

OpenID Connect supports a `prompt` parameter that can be used to control the user experience as it relates to the current authentication session. Duende BFF v4 supports this parameter by forwarding it to the backing identity provider to allow for more fine-grained control during unique client interactions.

This documentation outlines the `prompt` parameter support and what values you might use to achieve different outcomes.

## Prompt parameter options

The [OpenID Connect specification](https://openid.net/specs/openid-connect-core-1_0.html) defines an **optional** `prompt` parameter that can be used to control the user experience as it relates to the current authentication session. The following values are supported:

| value            | description                                                                                       |
|------------------|---------------------------------------------------------------------------------------------------|
| `none`           | Must not display any authentication or consent user interface                                     |
| `login`          | Should prompt the user to reauthenticate                                                          |
| `consent`        | Should prompt the user for consent                                                                |
| `select_account` | Should prompt user to choose an account given their are multiple accounts for the current session |

These values can be passed to the BFF by adding them to the `prompt` query parameter to the login request URL. For example, the following request would prompt the user to reauthenticate:

```http
/bff/login?prompt=<prompt value>
```

The inclusion of the `prompt` parameter in the login request URL will cause the BFF to forward it to the backing identity provider at which point the identity provider will determine the appropriate user experience based on the value of the `prompt` parameter. For example, if the `prompt` parameter is set to `login`, the identity provider will prompt the user to reauthenticate.

:::note
Be aware that the exact behavior of the `prompt` parameter is not defined by the OpenID Connect specification and may vary between identity providers. Consult the documentation for your identity provider for more information.
:::

## Scenarios and Situations

The `prompt` parameter can be used in situations where additional security is required, you want to reestablish the account identity, or a high-impact action is about to be taken. For example, the following hypothetical scenarios might require the use of the `prompt` parameter:

- Attempting to transfer funds from a bank account to another
- A destructive action such as deleting an account
- Performing an action that alters a high-value account setting such as an email address

## Silent Login Deprecation (v3 to v4)

When migrating from Duende BFF v3 to v4, you may notice deprecation warnings regarding the [silent login](/bff/fundamentals/session/management/silent-login.md) feature found at the user endpoint of `/silent-login`. You should discontinue use of the silent login feature and instead use the `prompt` parameter to achieve the same result.






