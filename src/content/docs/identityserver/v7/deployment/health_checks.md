---
title: "Health Checks"
weight: 50
---
You can use ASP.NET's [health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks) to monitor the health of your IdentityServer deployment. Health checks can contain arbitrary logic to test various conditions of a system. One common strategy for checking the health of IdentityServer is to make discovery requests. Successful discovery responses indicate not just that the IdentityServer host is running and able to receive requests and generate responses, but also that it was able to communicate with the configuration store. 

The following example code creates a health check that makes requests to the discovery endpoint. It finds the discovery endpoint's handler by name, which requires IdentityServer *v6.3*.

```
public class DiscoveryHealthCheck : IHealthCheck
{
    private readonly IEnumerable<Hosting.Endpoint> _endpoints;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DiscoveryHealthCheck(IEnumerable<Hosting.Endpoint> endpoints, IHttpContextAccessor httpContextAccessor)
    {
        _endpoints = endpoints;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = _endpoints.FirstOrDefault(x => x.Name == IdentityServerConstants.EndpointNames.Discovery);
            if (endpoint != null)
            {
                var handler = _httpContextAccessor.HttpContext.RequestServices.GetRequiredService(endpoint.Handler) as IEndpointHandler;
                if (handler != null)
                {
                    var result = await handler.ProcessAsync(_httpContextAccessor.HttpContext);
                    if (result is DiscoveryDocumentResult)
                    {
                        return HealthCheckResult.Healthy();
                    }
                }
            }
        }
        catch
        {
        }
        
        return new HealthCheckResult(context.Registration.FailureStatus);
    }
}
```

Another health check that you can perform is to request the public keys that IdentityServer uses to sign tokens - the JWKS (JSON Web Key Set). Doing so demonstrates that IdentityServer is able to communicate with the signing key store, a critical dependency. The following example code creates such a health check. Just as with the previous health check, it finds the endpoint's handler by name, which requires IdentityServer *v6.3*.

```
public class DiscoveryKeysHealthCheck : IHealthCheck
{
    private readonly IEnumerable<Hosting.Endpoint> _endpoints;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DiscoveryKeysHealthCheck(IEnumerable<Hosting.Endpoint> endpoints, IHttpContextAccessor httpContextAccessor)
    {
        _endpoints = endpoints;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = _endpoints.FirstOrDefault(x => x.Name == IdentityServerConstants.EndpointNames.Jwks);
            if (endpoint != null)
            {
                var handler = _httpContextAccessor.HttpContext.RequestServices.GetRequiredService(endpoint.Handler) as IEndpointHandler;
                if (handler != null)
                {
                    var result = await handler.ProcessAsync(_httpContextAccessor.HttpContext);
                    if (result is JsonWebKeysResult)
                    {
                        return HealthCheckResult.Healthy();
                    }
                }
            }
        }
        catch
        {
        }

        return new HealthCheckResult(context.Registration.FailureStatus);
    }
}
```