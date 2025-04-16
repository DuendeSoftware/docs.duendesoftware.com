---
title: "Custom Token Request Validator"
description: Documentation for the ICustomTokenRequestValidator interface which allows inserting custom validation logic into token requests with the ability to modify request parameters and response fields.
sidebar:
  order: 20
redirect_from:
  - /identityserver/v5/reference/validators/custom_token_request_validator/
  - /identityserver/v6/reference/validators/custom_token_request_validator/
  - /identityserver/v7/reference/validators/custom_token_request_validator/
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

* **`ValidateAsync`**

  This method gets called during token request processing. The context gives you access to request and response
  parameters.

  You can also change certain parameters on the validated request object, e.g. the token lifetime, token type,
  confirmation method and client claims.

  The `CustomResponse` dictionary allows emitting additional response fields.

  To fail the request, set the `IsError`, the `Error`, and optionally the `ErrorDescription` properties on the
  `Result` object on the `CustomTokenRequestValidationContext`.
