---
title: "BFF Back-Channel Logout Endpoint Extensibility"
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Back-Channel Logout"
  order: 60
redirect_from:
  - /bff/v2/extensibility/management/back-channel-logout/
  - /bff/v3/extensibility/management/back-channel-logout/
  - /identityserver/v5/bff/extensibility/management/back-channel-logout/
  - /identityserver/v6/bff/extensibility/management/back-channel-logout/
  - /identityserver/v7/bff/extensibility/management/back-channel-logout/
---

The back-channel logout endpoint has several extensibility points organized into two interfaces and their default implementations. The *IBackChannelLogoutService* is the top level abstraction that processes requests to the endpoint. This service can be used to add custom request processing logic or to change how it validates incoming requests. When the back-channel logout endpoint receives a valid request, it revokes sessions using the *ISessionRevocationService*. 

## Request Processing
You can add custom logic to the endpoint by implementing the *IBackChannelLogoutService* or by extending its default implementation (*Duende.Bff.DefaultBackChannelLogoutService*). In most cases, extending the default implementation is preferred, as it has several virtual methods that can be overridden to customize particular aspects of how the request is processed.

*ProcessRequestAsync* is the top level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

```csharp
public class CustomizedBackChannelLogoutService : DefaultBackChannelLogoutService
{
    public override Task ProcessRequestAsync(HttpContext context)
    {
        // Custom logic here

        return base.ProcessRequestAsync(context);
    }
}
```

## Validation

Validation of the incoming request can be customized by overriding one of several virtual methods in the *DefaultBackChannelLogoutService*. *GetTokenValidationParameters* allows you to specify the *[TokenValidationParameters](https://learn.microsoft.com/en-us/dotnet/API/microsoft.identitymodel.tokens.tokenvalidationparameters?view=azure-dotnet)* used to validate the incoming logout token. The default implementation creates token validation parameters based on the authentication scheme's configuration. Your override could begin by calling the base method and then make changes to those parameters or completely customize how token validation parameters are created. For example:

```csharp
public class CustomizedBackChannelLogoutService : DefaultBackChannelLogoutService
{
    protected override async Task<TokenValidationParameters> GetTokenValidationParameters()
    {
        var tokenValidationParams = await base.GetTokenValidationParameters();

        // Set custom parameters here
        // For example, make clock skew more permissive than it is by default:
        tokenValidationParams.ClockSkew = TimeSpan.FromMinutes(15);

        return tokenValidationParams;
    }
}
```
If you need more control over the validation of the logout token, you can override *ValidateJwt*. The default implementation of *ValidateJwt* validates the token and produces a *ClaimsIdentity* using a *[JsonWebTokenHandler](https://github.com/AzureAD/azure-activedirectory-identitymodel-extensions-for-dotnet/wiki/ValidatingTokens)* and the token validation parameters returned from *GetTokenValidationParameters*. Your override could call the base method and then manipulate this *ClaimsIdentity* or add a completely custom method for producing the *ClaimsIdentity* from the logout token.

*ValidateLogoutTokenAsync* is the coarsest-grained validation method. It is responsible for validating the incoming logout token and determining if logout should proceed, based on claims in the token. It returns a *ClaimsIdentity* if logout should proceed or null if it should not. Your override could prevent logout in certain circumstances by returning null. For example:

```csharp
public class CustomizedBackChannelLogoutService : DefaultBackChannelLogoutService
{
    protected override async Task<ClaimsIdentity?> ValidateLogoutTokenAsync(string logoutToken)
    {
        var identity = await base.ValidateLogoutTokenAsync(logoutToken);

        // Perform custom logic here
        // For example, prevent logout based on certain conditions
        if(identity?.FindFirst("sub")?.Value == "12345") 
        {
            return null;
        } 
        else 
        {
            return identity;
        }
    }
}
```

## Session Revocation
The back-channel logout service will call the registered session revocation service to revoke the user session when it receives a valid logout token. To customize the revocation process, implement the *ISessionRevocationService*. 
