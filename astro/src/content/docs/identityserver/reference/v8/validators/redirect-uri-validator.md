---
title: "Redirect URI Validator"
description: Documentation for the IRedirectUriValidator interface which validates redirect URIs and post-logout redirect URIs submitted in authorization and end-session requests.
sidebar:
  label: Redirect URI
  order: 30
redirect_from:
  - /identityserver/v5/reference/validators/redirect_uri_validator/
  - /identityserver/v6/reference/validators/redirect_uri_validator/
  - /identityserver/reference/validators/redirect-uri-validator/
---

#### Duende.IdentityServer.Validation.IRedirectUriValidator

Validates redirect URIs and post-logout redirect URIs submitted in authorization and end-session requests.

IdentityServer invokes this validator during the authorization request pipeline to confirm that the `redirect_uri` 
parameter supplied by the client is permitted for that client, and during the end-session pipeline to confirm 
that the `post_logout_redirect_uri` is permitted.

The default implementation performs an exact string match against the URIs registered on the client. Override 
this interface to apply custom matching logic, such as wildcard or pattern-based URI validation.

```csharp
/// <summary>
/// Validates redirect URIs and post-logout redirect URIs submitted in authorization and end-session requests.
/// </summary>
public interface IRedirectUriValidator
{
    /// <summary>
    /// Determines whether a redirect URI is valid for a client.
    /// </summary>
    [Obsolete("Use the overload that takes a RedirectUriValidationContext parameter instead.")]
    Task<bool> IsRedirectUriValidAsync(string requestedUri, Client client);

    /// <summary>
    /// Determines whether a redirect URI is valid for a client.
    /// </summary>
    Task<bool> IsRedirectUriValidAsync(RedirectUriValidationContext context, CancellationToken ct);

    /// <summary>
    /// Determines whether a post-logout redirect URI is valid for a client.
    /// </summary>
    Task<bool> IsPostLogoutRedirectUriValidAsync(string requestedUri, Client client, CancellationToken ct);
}
```

## IRedirectUriValidator APIs

* **`IsRedirectUriValidAsync(RedirectUriValidationContext, CancellationToken)`**

  Determines whether a `redirect_uri` is valid for a client. This overload is preferred because it provides 
  additional context such as the full request parameters, any validated request object values, and the type 
  of authorize request (e.g., PAR vs. standard authorize).

* **`IsRedirectUriValidAsync(string, Client)`** *(Deprecated)*

  Legacy overload that only receives the requested URI and client. Marked as obsolete and will be removed 
  in a future version. Use the context-based overload instead.

* **`IsPostLogoutRedirectUriValidAsync`**

  Called during end-session request processing to verify that the `post_logout_redirect_uri` parameter 
  supplied by the client is registered and permitted.

## RedirectUriValidationContext

Models the context for validating a client's redirect URI.

* **`RequestedUri`** - The URI to validate for the client.

* **`Client`** - The client whose registered redirect URIs should be checked.

* **`RequestParameters`** - The raw request parameters as a `NameValueCollection`.

* **`RequestObjectValues`** - Validated request object values as a collection of claims. May be `null` if no 
  request object was submitted.

* **`AuthorizeRequestType`** - Indicates the context of the request: PAR vs. standard authorize with or 
  without pushed parameters.

## Registration

Register a custom implementation using `AddRedirectUriValidator<T>()` on the IdentityServer builder:

```csharp
builder.Services.AddIdentityServer()
    .AddRedirectUriValidator<CustomRedirectUriValidator>();
```

## Examples

### Wildcard subdomain matching

This example allows redirect URIs that match a registered pattern with a wildcard subdomain:

```csharp
public class WildcardRedirectUriValidator : IRedirectUriValidator
{
    public Task<bool> IsRedirectUriValidAsync(RedirectUriValidationContext context, CancellationToken ct)
    {
        var requestedUri = new Uri(context.RequestedUri);

        foreach (var registeredUri in context.Client.RedirectUris)
        {
            if (registeredUri.StartsWith("https://*."))
            {
                // Extract the domain pattern (e.g., "*.example.com")
                var pattern = registeredUri.Substring("https://".Length);
                var domain = pattern.Substring(2); // Remove "*."
                
                if (requestedUri.Host.EndsWith(domain) && 
                    requestedUri.Scheme == "https")
                {
                    return Task.FromResult(true);
                }
            }
            else if (context.RequestedUri == registeredUri)
            {
                return Task.FromResult(true);
            }
        }

        return Task.FromResult(false);
    }

    public Task<bool> IsRedirectUriValidAsync(string requestedUri, Client client)
    {
        // Delegate to the context-based overload
        var context = new RedirectUriValidationContext
        {
            RequestedUri = requestedUri,
            Client = client
        };
        return IsRedirectUriValidAsync(context, CancellationToken.None);
    }

    public Task<bool> IsPostLogoutRedirectUriValidAsync(string requestedUri, Client client, CancellationToken ct)
    {
        // Apply similar wildcard logic or exact matching
        return Task.FromResult(client.PostLogoutRedirectUris.Contains(requestedUri));
    }
}
```

:::caution[Security Warning]
Custom redirect URI validation must be implemented carefully. Overly permissive validation can enable 
open redirect vulnerabilities that attackers can exploit to steal authorization codes or tokens. Always 
validate that redirect URIs are under your control and match the expected patterns for the client.
:::
