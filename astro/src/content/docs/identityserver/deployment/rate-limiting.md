---
title: "Rate Limiting Duende IdentityServer Endpoints"
description: "When to rate limit Duende IdentityServer, and how to do it at the network layer, with ASP.NET Core middleware, or with a custom token request validator."
date: 2026-09-02T08:00:00+02:00
sidebar:
  label: Rate Limiting
  order: 20
---

Duende IdentityServer does not include built-in rate limiting. It's an infrastructure concern, and
the right approach depends on your architecture, threat model, and traffic, so IdentityServer leaves
it to your [deployment infrastructure](/identityserver/deployment/index.md). This page covers whether
you need it and the three places you can apply it.

## Do You Need Rate Limiting?

For most deployments, you don't. IdentityServer usually serves a known set of clients and users, and
a flood of requests is normally a symptom of a misconfiguration: token lifetimes that are too short,
missing token caching, or a retry loop in a client. Investigate the cause before you reach for rate limiting.

Consider rate limiting when:

* A **misbehaving client** cannot be fixed immediately, such as a third-party or legacy application
* The authorize or token endpoints are **exposed to the public internet**
* A **multi-tenant** deployment must stop one tenant's traffic from affecting others
* **Compliance requirements** mandate throttling on authentication endpoints

## Where To Apply Rate Limiting

The three options below run from coarse to fine-grained, and you can combine them.

### Rate Limiting At The Network Layer

Throttle traffic before it reaches your application using a reverse proxy, load balancer, or API
gateway such as nginx, Azure Application Gateway, AWS API Gateway, or Cloudflare. This needs no
application changes and rejects requests before they consume any application resources. It can only
partition by request properties like IP address or path, not by OAuth client or user identity, so it
works best as a first line of defense.

### Rate Limiting With ASP.NET Core Middleware

Use the built-in [ASP.NET Core rate limiting middleware](https://learn.microsoft.com/aspnet/core/performance/rate-limit)
to throttle requests in the HTTP pipeline. Register it before IdentityServer so traffic is throttled
before IdentityServer does any work.

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
            });
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ...

app.UseRateLimiter();
app.UseIdentityServer();
```

:::caution
IdentityServer matches its protocol endpoints (such as `/connect/authorize` and `/connect/token`)
with its own middleware, not ASP.NET Core endpoint routing. You cannot attach a named, per-endpoint
rate limiting policy to a protocol endpoint; only the **global limiter** applies. To approximate
per-endpoint limits, partition the global limiter on `context.Request.Path`. Named policies still
work on your own routed pages, such as the login and consent Razor Pages.
:::

For the token endpoint, return a descriptive JSON error instead of a bare `429`, and add a
`Retry-After` header where you can, so clients know when to try again.

### Rate Limiting With A Custom Token Request Validator

For identity-aware limits, implement
[`ICustomTokenRequestValidator`](/identityserver/tokens/dynamic-validation.md). It runs after the
token request is validated, so you already know the authenticated client and user, and rejected
requests come back as proper OAuth errors.

```csharp
// ClientRateLimitTokenRequestValidator.cs
public class ClientRateLimitTokenRequestValidator : ICustomTokenRequestValidator
{
    private static readonly PartitionedRateLimiter<string> Limiter =
        PartitionedRateLimiter.Create<string, string>(clientId =>
            RateLimitPartition.GetFixedWindowLimiter(clientId, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                }));

    public Task ValidateAsync(
        CustomTokenRequestValidationContext context,
        CancellationToken cancellationToken)
    {
        var clientId = context.Result.ValidatedRequest.ClientId;

        using var lease = Limiter.AttemptAcquire(clientId);
        if (!lease.IsAcquired)
        {
            context.Result.IsError = true;
            context.Result.Error = "rate_limit_exceeded";
            context.Result.ErrorDescription = "Too many token requests for this client.";
        }

        return Task.CompletedTask;
    }
}
```

```csharp
// Program.cs
idsvrBuilder.AddCustomTokenRequestValidator<ClientRateLimitTokenRequestValidator>();
```

By the time the validator runs, client authentication, secret validation, and database lookups have
already happened, so you still pay for requests you end up rejecting. For high-volume abuse, pair it
with a coarser layer above.

## How To Choose A Rate Limiting Approach?

Most deployments that need rate limiting only need the network layer. If you need more, stack them:
the network appliance for volumetric protection, the ASP.NET Core global limiter to shield the
pipeline, and a custom token request validator for per-client or per-user decisions. Either way, find
out why a client is sending so many requests first. Rate limiting is a safety net, not a fix for a
misconfigured client.
