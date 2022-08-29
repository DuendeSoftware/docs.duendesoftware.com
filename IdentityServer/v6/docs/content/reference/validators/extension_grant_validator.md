---
title: "Extension Grant Validator"
weight: 40
---

#### Duende.IdentityServer.Validation.IExtensionGrantValidator

Use an implementation of this interface to handle [extension grants]({{< ref "/tokens/extension_grants" >}}).

```cs
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

* ***GrantType***

    Specifies the name of the extension grant that the implementation wants to register for.

* ***ValidateAsync***
    
    This methods gets called at runtime, when a request comes in that is using the registered extension grant.
    The job of this method is to validate the request and to populate *ExtensionGrantValidationContext.Result* with a [grant validation result]({{< ref "/reference/models/grant_validation_result" >}})

The instance of the extension grant validator gets registered with:

```cs
builder.AddExtensionGrantValidator<MyValidator>();
```