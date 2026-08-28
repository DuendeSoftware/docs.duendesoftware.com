---
title: "Custom Identity & Profile Management"
description: "Guide to implementing IProfileService in Duende IdentityServer to connect to any custom user database or store"
sidebar:
  label: "Custom"
  order: 30
---

When neither [User Management](/identityserver/identity/user-management/index.mdx) nor [ASP.NET Identity](/identityserver/identity/aspnet-identity/index.md) fits your requirements, you can implement `IProfileService` directly. This interface is how IdentityServer connects to your user database or store to load user claims and determine whether a user is active.

Implementing `IProfileService` yourself gives you full control over the data access code, letting you connect IdentityServer to any user store, whether a legacy database, an LDAP directory, an external API, or any other source of user data.

## The IProfileService Interface

`IProfileService` has two methods:

- **`GetProfileDataAsync`**: Called when IdentityServer needs to load claims for a user. You receive a `ProfileDataRequestContext` that contains the subject (the authenticated user), the requested claim types, and the client making the request. Populate `context.IssuedClaims` with the claims to include in the token.

- **`IsActiveAsync`**: Called to determine whether a user is currently allowed to obtain tokens. Return `context.IsActive = false` to block token issuance for disabled or locked-out users.

```csharp
public class MyProfileService : IProfileService
{
    private readonly IUserRepository _users;

    public MyProfileService(IUserRepository users)
    {
        _users = users;
    }

    public async Task GetProfileDataAsync(
        ProfileDataRequestContext context,
        CancellationToken cancellationToken)
    {
        var user = await _users.FindByIdAsync(
            context.Subject.GetSubjectId(), cancellationToken);

        context.IssuedClaims.AddRange(new[]
        {
            new Claim(JwtClaimTypes.Name, user.DisplayName),
            new Claim(JwtClaimTypes.Email, user.Email),
            // add any other claims your application needs
        });
    }

    public async Task IsActiveAsync(
        IsActiveContext context,
        CancellationToken cancellationToken)
    {
        var user = await _users.FindByIdAsync(
            context.Subject.GetSubjectId(), cancellationToken);

        context.IsActive = user != null && user.IsEnabled;
    }
}
```

Register your implementation in `Program.cs`:

```csharp
builder.Services.AddIdentityServer()
    .AddProfileService<MyProfileService>();
```

## Customizing Claims with Ready-Made Providers

`IProfileService` is also the extension point for **customizing claims** when using User Management or ASP.NET Identity. You do not need to replace the built-in implementation entirely — you can decorate or extend it.

See [Claims](/identityserver/fundamentals/claims.md) for more on how claims are populated and transformed.
