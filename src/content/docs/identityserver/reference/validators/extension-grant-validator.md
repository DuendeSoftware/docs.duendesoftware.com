---
title: "Extension Grant Validator"
description: Documentation for the IExtensionGrantValidator interface which enables custom OAuth grant types by handling validation of extension grant requests.
sidebar:
  label: Extension Grant
  order: 80
redirect_from:
  - /identityserver/v5/reference/validators/extension_grant_validator/
  - /identityserver/v6/reference/validators/extension_grant_validator/
  - /identityserver/v7/reference/validators/extension_grant_validator/
---

#### Duende.IdentityServer.Validation.IExtensionGrantValidator

Use an implementation of this interface to handle [extension grants](/identityserver/tokens/extension-grants.md).

```csharp
public interface IExtensionGrantValidator
{
    /// <summary>
    /// Handles the custom grant request.
    /// </summary>
    /// <param name="request">The validation context.</param>
    Task ValidateAsync(ExtensionGrantValidationContext context);

    /// <summary>
    /// Returns the grant type this validator can deal with
    /// </summary>
    /// <value>
    /// The type of the grant.
    /// </value>
    string GrantType { get; }
}
```

* **`GrantType`**

  Specifies the name of the extension grant that the implementation wants to register for.

* **`ValidateAsync`**

  This method gets called at runtime, when a request comes in that is using the registered extension grant.
  The job of this method is to validate the request and to populate `ExtensionGrantValidationContext.Result` with
  a [grant validation result](/identityserver/reference/models/grant-validation-result.md)

The instance of the extension grant validator gets registered with:

```csharp
// Program.cs
builder.AddExtensionGrantValidator<MyValidator>();
```
