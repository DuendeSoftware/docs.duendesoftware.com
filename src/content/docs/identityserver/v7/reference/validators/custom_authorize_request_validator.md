---
title: "Custom Authorize Request Validator"
weight: 10
---

#### Duende.IdentityServer.Validation.ICustomAuthorizeRequestValidator

Allows running custom code as part of the authorization issuance pipeline at the authorization endpoint.

```cs
/// <summary>
/// Allows inserting custom validation logic into authorize requests
/// </summary>
public interface ICustomAuthorizeRequestValidator
{
    /// <summary>
    /// Custom validation logic for the authorize request.
    /// </summary>
    /// <param name="context">The context.</param>
    Task ValidateAsync(CustomAuthorizeRequestValidationContext context);
}
```

* ***ValidateAsync***

    This method gets called during authorize request processing. The context gives you access to request and response parameters.

    To fail the request, set the the *IsError*, the *Error*, and optionally the *ErrorDescription* properties on the *Result* object on the *CustomAuthorizeRequestValidationContext*.
