---
title: "Custom Token Request Validator"
date: 2020-09-10T08:22:12+02:00
weight: 47
---

#### Duende.IdentityServer.Validation.ICustomTokenRequestValidator

Allows running custom code as part of the token issuance pipeline at the token endpoint.

```cs
/// <summary>
/// Allows inserting custom validation logic into token requests
/// </summary>
public interface ICustomTokenRequestValidator
{
    /// <summary>
    /// Custom validation logic for a token request.
    /// </summary>
    /// <param name="context">The context.</param>
    /// <returns>
    /// The validation result
    /// </returns>
    Task ValidateAsync(CustomTokenRequestValidationContext context);
}
```

* ***ValidateAsync***

    This method gets called during token request processing. The context gives you access to request and response parameters.

    You can also change certain parameters on the validated request object, e.g. the token lifetime, toke type, confirmation method and client claims.

    The *CustomResponse* dictionary allows emitting additional response fields.

