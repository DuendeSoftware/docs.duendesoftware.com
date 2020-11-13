---
title: "Grant Validation Result"
date: 2020-09-10T08:22:12+02:00
weight: 45
---

#### Duende.IdentityServer.Validation.GrantValidationResult

The *GrantValidationResult* class models the outcome of grant validation for extensions grants (TODO link) and resource owner password grants (TODO link).

```cs
public class ExtensionGrantValidator : IExtensionGrantValidator
{
    public Task ValidateAsync(ExtensionGrantValidationContext context)
    {
        if (success)
        {
            context.Result = new GrantValidationResult(subject: "818727", authenticationMethod: "custom");
        }
        else
        {
            // custom error message
            context.Result = new GrantValidationResult(TokenRequestErrors.InvalidGrant, "invalid custom credential");
        }

        return Task.CompletedTask;
    }
}
```

The most common usage is to either new it up using an identity (success case):

```cs
context.Result = new GrantValidationResult(
    subject: "818727", 
    authenticationMethod: "custom", 
    claims: optionalClaims);
```

...or using an error and description (failure case):

```cs
context.Result = new GrantValidationResult(
    TokenRequestErrors.InvalidGrant, 
    "invalid custom credential");
```

In both case you can pass additional custom values that will be included in the token response.