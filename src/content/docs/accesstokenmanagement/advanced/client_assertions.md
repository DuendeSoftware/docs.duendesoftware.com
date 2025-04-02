---
title: Client Assertions
sidebar:
  order: 30
---

If your token client is using a client assertion instead of a shared secret, you can provide the assertion in two ways

* use the request parameter mechanism to pass a client assertion to the management
* implement the `IClientAssertionService` interface to centralize client assertion creation

Here's a sample client assertion service using the Microsoft JWT library:

```cs
public class ClientAssertionService : IClientAssertionService
{
    private readonly IOptionsSnapshot<ClientCredentialsClient> _options;

    public ClientAssertionService(IOptionsSnapshot<ClientCredentialsClient> options)
    {
        _options = options;
    }

    public Task<ClientAssertion?> GetClientAssertionAsync(
      string? clientName = null, TokenRequestParameters? parameters = null)
    {
        if (clientName == "invoice")
        {
            var options = _options.Get(clientName);

            var descriptor = new SecurityTokenDescriptor
            {
                Issuer = options.ClientId,
                Audience = options.TokenEndpoint,
                Expires = DateTime.UtcNow.AddMinutes(1),
                SigningCredentials = GetSigningCredential(),

                Claims = new Dictionary<string, object>
                {
                    { JwtClaimTypes.JwtId, Guid.NewGuid().ToString() },
                    { JwtClaimTypes.Subject, options.ClientId! },
                    { JwtClaimTypes.IssuedAt, DateTime.UtcNow.ToEpochTime() }
                },

                AdditionalHeaderClaims = new Dictionary<string, object>
                {
                    { JwtClaimTypes.TokenType, "client-authentication+jwt" }
                }
            };

            var handler = new JsonWebTokenHandler();
            var jwt = handler.CreateToken(descriptor);

            return Task.FromResult<ClientAssertion?>(new ClientAssertion
            {
                Type = OidcConstants.ClientAssertionTypes.JwtBearer,
                Value = jwt
            });
        }

        return Task.FromResult<ClientAssertion?>(null);
    }
}
```

