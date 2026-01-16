---
title: "Grant Validation Result"
description: "Reference documentation for the GrantValidationResult class which models the outcome of grant validation for extension grants and resource owner password grants in Duende IdentityServer."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 45
redirect_from:
  - /identityserver/v5/reference/models/grant_validation_result/
  - /identityserver/v6/reference/models/grant_validation_result/
  - /identityserver/v7/reference/models/grant_validation_result/
---

## Duende.IdentityServer.Validation.GrantValidationResult

The `GrantValidationResult` class models the outcome of grant validation
for [extensions grants](/identityserver/tokens/extension-grants.md)
and  [resource owner password grants](/identityserver/tokens/password-grant.md).

It models either a successful validation result with claims (e.g. subject ID) or an invalid result with an error code
and message, e.g.:

```csharp
public class ExtensionGrantValidator : IExtensionGrantValidator
{
    public Task ValidateAsync(ExtensionGrantValidationContext context)
    {
        // some validation steps 

        if (success)
        {
            context.Result = new GrantValidationResult(
                subject: "818727", 
                authenticationMethod: "custom",
                claims: extraClaims);
        }
        else
        {
            // custom error message
            context.Result = new GrantValidationResult(
                TokenRequestErrors.InvalidGrant, 
                "invalid custom credential");
        }

        return Task.CompletedTask;
    }
}
```

It also allows passing additional custom values that will be included in the token response, e.g.:

```csharp
context.Result = new GrantValidationResult(
    subject: "818727",
    authenticationMethod: "custom",
    customResponse: new Dictionary<string, object>
    {
        { "some_data", "some_value" }
    });
```

This will result in the following token response:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 360,
  "some_data": "some_value"
}
```
