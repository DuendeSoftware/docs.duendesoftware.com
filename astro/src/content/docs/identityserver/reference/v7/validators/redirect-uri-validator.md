---
title: "Redirect URI Validator"
description: Documentation for the IRedirectUriValidator interface which validates redirect URIs and post-logout redirect URIs submitted in authorization and end-session requests.
sidebar:
  label: Redirect URI
  order: 30
redirect_from:
  - /identityserver/v7/reference/validators/redirect_uri_validator/
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
    Task<bool> IsRedirectUriValidAsync(string requestedUri, Client client);

    /// <summary>
    /// Determines whether a post-logout redirect URI is valid for a client.
    /// </summary>
    Task<bool> IsPostLogoutRedirectUriValidAsync(string requestedUri, Client client);
}
```

## IRedirectUriValidator APIs

* **`IsRedirectUriValidAsync`**

  Determines whether a `redirect_uri` is valid for a client. Called during authorization request processing 
  to verify that the redirect URI parameter supplied by the client is registered and permitted.

* **`IsPostLogoutRedirectUriValidAsync`**

  Called during end-session request processing to verify that the `post_logout_redirect_uri` parameter 
  supplied by the client is registered and permitted.

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
    public Task<bool> IsRedirectUriValidAsync(string requestedUri, Client client)
    {
        var uri = new Uri(requestedUri);

        foreach (var registeredUri in client.RedirectUris)
        {
            if (registeredUri.StartsWith("https://*."))
            {
                // Extract the domain pattern (e.g., "*.example.com")
                var pattern = registeredUri.Substring("https://".Length);
                var domain = pattern.Substring(2); // Remove "*."
                
                if (uri.Host.EndsWith(domain) && uri.Scheme == "https")
                {
                    return Task.FromResult(true);
                }
            }
            else if (requestedUri == registeredUri)
            {
                return Task.FromResult(true);
            }
        }

        return Task.FromResult(false);
    }

    public Task<bool> IsPostLogoutRedirectUriValidAsync(string requestedUri, Client client)
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
