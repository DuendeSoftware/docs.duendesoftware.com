---
title: "Extension Grants"
date: 2020-09-10T08:22:12+02:00
weight: 35
---

OAuth defines an extensibility point called extension grants.

Extension grants are a way to add support for non-standard token issuance scenarios like token translation, delegation, or custom credentials.

You can add support for additional grant types by implementing the *IExtensionGrantValidator* interface::

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

The *ExtensionGrantValidationContext* object gives you access to:

* the incoming token request - both the well-known validated values, as well as any custom values (via the *Raw* collection)
* the [result]({{< ref "/reference/grant_validation_result" >}}) - either error or success
* custom response parameters

To register the extension grant, add it to DI:

```cs
builder.AddExtensionGrantValidator<MyExtensionsGrantValidator>();
```

TODO: see the token exchange section for an example on how to use extension grants