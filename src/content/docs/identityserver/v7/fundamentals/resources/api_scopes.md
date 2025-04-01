---
title: "API Scopes"
description: "Overview"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 20
---

Designing your API surface can be a complicated task. Duende IdentityServer provides a couple of primitives to help you
with that.

The original OAuth 2.0 specification has the concept of scopes, which is just defined as *the scope of access* that the
client requests.
Technically speaking, the `scope` parameter is a list of space delimited values - you need to provide the structure and
semantics of it.

In more complex systems, often the notion of a `resource` is introduced. This might be e.g. a physical or logical API.
In turn each API can potentially have scopes as well. Some scopes might be exclusive to that resource, and some scopes
might be shared.

Let's start with simple scopes first, and then we'll have a look how resources can help structure scopes.

### Scopes

Let's model something very simple - a system that has three logical operations `read`, `write`, and `delete`.

You can define them using the `ApiScope` class:

```cs
public static IEnumerable<ApiScope> GetApiScopes()
{
    return new List<ApiScope>
    {
        new ApiScope(name: "read",   displayName: "Read your data."),
        new ApiScope(name: "write",  displayName: "Write your data."),
        new ApiScope(name: "delete", displayName: "Delete your data.")
    };
}
```

You can then assign the scopes to various clients, e.g.:

```cs
var webViewer = new Client
{
    ClientId = "web_viewer",
    
    AllowedScopes = { "openid", "profile", "read" }
};

var mobileApp = new Client
{
    ClientId = "mobile_app",
    
    AllowedScopes = { "openid", "profile", "read", "write", "delete" }
}
```

### Authorization based on Scopes

When a client asks for a scope (and that scope is allowed via configuration and not denied via consent),
the value of that scope will be included in the resulting access token as a claim of type `scope` (for both JWTs and
introspection), e.g.:

```json
{
  "typ": "at+jwt"
}.
{
  "client_id": "mobile_app",
  "sub": "123",
  "scope": "read write delete"
}
```

:::note
The format of the `scope` parameter can be controlled by the `EmitScopesAsSpaceDelimitedStringInJwt` setting on the
options.
Historically IdentityServer emitted scopes as an array, but you can switch to a space delimited string instead.
:::

The consumer of the access token can use that data to make sure that the client is actually allowed to invoke the
corresponding functionality. See the [APIs](/identityserver/v7/apis) section for more information on protecting APIs
with access tokens.

:::caution
Be aware, that scopes are purely for authorizing clients, not users. In other words, the `write` scope allows the client
to invoke the functionality associated with the scope and is unrelated to the user's permission to do so. This
additional user centric authorization is application logic and not covered by OAuth, yet still possibly important to
implement in your API.
:::

### Adding user claims

You can add more identity information about the user to the access token.
The additional claims added are based on the scope requested.
The following scope definition tells the configuration system that when a `write` scope gets granted the `user_level`
claim should be added to the access token:

```cs
var writeScope = new ApiScope(
    name: "write",
    displayName: "Write your data.",
    userClaims: new[] { "user_level" });
```

This will pass the `user_level` claim as a requested claim type to the profile service,
so that the consumer of the access token can use this data as input for authorization decisions or business logic.

:::note
When using the scope-only model, no aud (audience) claim will be added to the token since this concept does not apply.
If you need an aud claim, you can enable the `EmitStaticAudienceClaim` setting on the options. This will emit an aud
claim in the `issuer_name/resources` format. If you need more control of the aud claim, use API resources.
:::

### Parameterized Scopes

Sometimes scopes have a certain structure, e.g. a scope name with an additional parameter: `transaction:id` or
`read_patient:patientid`.

In this case you would create a scope without the parameter part and assign that name to a client, but in addition
provide some logic to parse the structure
of the scope at runtime using the `IScopeParser` interface or by deriving from our default implementation, e.g.:

```cs
public class ParameterizedScopeParser : DefaultScopeParser
{
    public ParameterizedScopeParser(ILogger<DefaultScopeParser> logger) : base(logger)
    { }

    public override void ParseScopeValue(ParseScopeContext scopeContext)
    {
        const string transactionScopeName = "transaction";
        const string separator = ":";
        const string transactionScopePrefix = transactionScopeName + separator;

        var scopeValue = scopeContext.RawValue;

        if (scopeValue.StartsWith(transactionScopePrefix))
        {
            // we get in here with a scope like "transaction:something"
            var parts = scopeValue.Split(separator, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2)
            {
                scopeContext.SetParsedValues(transactionScopeName, parts[1]);
            }
            else
            {
                scopeContext.SetError("transaction scope missing transaction parameter value");
            }
        }
        else if (scopeValue != transactionScopeName)
        {
            // we get in here with a scope not like "transaction"
            base.ParseScopeValue(scopeContext);
        }
        else
        {
            // we get in here with a scope exactly "transaction", which is to say we're ignoring it 
            // and not including it in the results
            scopeContext.SetIgnore();
        }
    }
}
```

You then have access to the parsed value throughout the pipeline, e.g. in the profile service:

```cs
public class HostProfileService : IProfileService
{
    public override async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var transaction = context.RequestedResources.ParsedScopes.FirstOrDefault(x => x.ParsedName == "transaction");
        if (transaction?.ParsedParameter != null)
        {
            context.IssuedClaims.Add(new Claim("transaction_id", transaction.ParsedParameter));
        }
    }
}
```