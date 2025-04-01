---
title: "Grant Validation Result"
date: 2020-09-10T08:22:12+02:00
order: 45
---

#### Duende.IdentityServer.Validation.GrantValidationResult

The *GrantValidationResult* class models the outcome of grant validation for [extensions grants](/identityserver/v5/tokens/extension_grants) and  [resource owner password grants](/identityserver/v5/tokens/password_grant).

It models either a successful validation result with claims (e.g. subject ID) or an invalid result with an error code and message, e.g.:

```cs
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

```cs
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