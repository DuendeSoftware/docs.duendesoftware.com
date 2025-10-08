---
title: Extensibility
description: Learn how to extend and customize Duende.AccessTokenManagement, including custom token retrieval.
sidebar:
  label: Extensibility
  order: 50
---

There are several extension points where you can customize the behavior of Duende.AccessTokenManagement.
The extension model is designed to favor composition over inheritance, making it easier to customize and extend while maintaining the library's core functionality.

## Token Retrieval

Token retrieval can be customized by implementing the `AccessTokenRequestHandler.ITokenRetriever` interface.
This interface defines a single method, `GetTokenAsync`, which is called by the `AccessTokenRequestHandler` to retrieve an access token.

The following snippet demonstrates how to implement a custom token retriever that dynamically determines which credential flow to use. It can be linked to your `HttpClient`.

```csharp
public class CustomTokenRetriever(
    UserTokenRequestParameters parameters,
    IClientCredentialsTokenManager clientCredentialsTokenManager,
    IUserTokenManager userTokenManagement,
    IUserAccessor userAccessor,
    ClientCredentialsClientName clientName) : AccessTokenRequestHandler.ITokenRetriever
{
    public async Task<TokenResult<AccessTokenRequestHandler.IToken>> GetTokenAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        // You'll have to make a decision on what token parameters to use,
        // and you can override the default parameters.
        var param = parameters with
        {
            Scope = Scope.Parse("some scope"),
            ForceTokenRenewal = request.GetForceRenewal() // for retry policies. 
        };

        AccessTokenRequestHandler.IToken token;

        // Get the type from current context.
        // Using a random number as an example here.
        int tokenType = new Random().Next(1, 2);

        if (tokenType == 1)
        {
            var getTokenResult = await clientCredentialsTokenManager
                .GetAccessTokenAsync(clientName, param, ct);
            
            if (!getTokenResult.Succeeded)
            {
                return getTokenResult.FailedResult;
            }

            token = getTokenResult.Token;
        }
        else
        {
            var user = await userAccessor.GetCurrentUserAsync(ct);

            var getTokenResult = await userTokenManagement
                .GetAccessTokenAsync(user, param, ct);
            
            if (!getTokenResult.Succeeded)
            {
                return getTokenResult.FailedResult;
            }
            
            token = getTokenResult.Token;
        }

        return TokenResult.Success(token);
    }
}
```