---
title: "Defining resources"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

The ultimate job of Duende IdentityServer is to control access to resources.

The two fundamental resource types in IdentityServer are:

* **identity resources** 

    represent claims about a user like user ID, display name, email address etc…

* **API resources** 

    represent functionality a client wants to access. Typically, they are HTTP-based endpoints (aka APIs), but could be also message queuing endpoints or similar.

## Identity Resources
An identity resource is a named group of claims that can be requested using the *scope* parameter.

The OpenID Connect specification [suggests](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) a couple of standard 
scope name to claim type mappings that might be useful to you for inspiration, but you can freely design them yourself.

One of them is actually mandatory, the *openid* scope, which tells the provider to return the *sub* (subject id) claim in the identity token.

This is how you could define the openid scope in code:

```cs
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResource(
            name: "openid",
            userClaims: new[] { "sub" },
            displayName: "Your user identifier")
    };
}
```

But since this is one of the standard scopes from the spec you can shorten that to:

```cs
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResources.OpenId()
    };
}
```
{{% notice note %}}
See the [reference]({{< ref "/reference/identity_resource" >}}) section for more information on *IdentityResource*.
{{% /notice %}}

The following example shows a custom identity resource called *profile* that represents the display name, email address and website claim:

```cs
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResource(
            name: "profile",
            userClaims: new[] { "name", "email", "website" },
            displayName: "Your profile data")
    };
}
```

Once the resource is defined, you can give access to it to a client via the *AllowedScopes* option (other properties omitted):

```cs
var client = new Client
{
    ClientId = "client",
    
    AllowedScopes = { "openid", "profile" }
};
```

{{% notice note %}}
See the [reference]({{< ref "/reference/client" >}}) section for more information on the *Client* class.
{{% /notice %}}

The client can then request the resource using the scope parameter (other parameters omitted):

    https://demo.duendesoftware.com/connect/authorize?client_id=client&scope=openid profile

IdentityServer will then use the scope names to create a list of requested claim types, 
and present that to your implementation of the [profile service]({{< ref "/reference/profile_service" >}}).

## APIs
Designing your API surface can be a complicated task. Duende IdentityServer provides a couple of primitives to help you with that.

The original OAuth 2.0 specification has the concept of scopes, which is just defined as *the scope of access* that the client requests.
Technically speaking, the *scope* parameter is a list of space delimited values - you need to provide the structure and semantics of it.

In more complex systems, often the notion of a *resource* is introduced. This might be e.g. a physical or logical API. 
In turn each API can potentially have scopes as well. Some scopes might be exclusive to that resource, and some scopes might be shared.

Let's start with simple scopes first, and then we'll have a look how resources can help structure scopes.

### Scopes
Let's model something very simple - a system that has three logical operations *read*, *write*, and *delete*.

You can define them using the *ApiScope* class:

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
the value of that scope will be included in the resulting access token as a claim of type *scope* (for both JWTs and introspection), e.g.:

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

{{% notice note %}}
The format of the *scope* parameter can be controlled by the *EmitScopesAsSpaceDelimitedStringInJwt* setting on the options.
Historically IdentityServer emitted scopes as an array, but you can switch to a space delimited string instead.
{{% /notice %}}

The consumer of the access token can use that data to make sure that the client is actually allowed to invoke the corresponding functionality. See the [APIs]({{< ref "/apis" >}}) section for more information on protecting APIs with access tokens.

{{% notice warning %}}
Be aware, that scopes are purely for authorizing clients, not users. In other words, the *write* scope allows the client to invoke the functionality associated with the scope and is unrelated to the user's permission to do so. This additional user centric authorization is application logic and not covered by OAuth, yet still possibly important to implement in your API.
{{% /notice %}}

You can add more identity information about the user to the access token.
The additional claims added are based on the scope requested. 
The following scope definition tells the configuration system that when a *write* scope gets granted the *user_level* claim should be added to the access token:

    var writeScope = new ApiScope(
        name: "write",
        displayName: "Write your data.",
        userClaims: new[] { "user_level" });

This will pass the *user_level* claim as a requested claim type to the profile service, 
so that the consumer of the access token can use this data as input for authorization decisions or business logic.

{{% notice note %}}
When using the scope-only model, no aud (audience) claim will be added to the token since this concept does not apply. If you need an aud claim, you can enable the *EmitStaticAudienceClaim* setting on the options. This will emit an aud claim in the *issuer_name/resources* format. If you need more control of the aud claim, use API resources.
{{% /notice %}}

### Parameterized Scopes
Sometimes scopes have a certain structure, e.g. a scope name with an additional parameter: *transaction:id* or *read_patient:patientid*.

In this case you would create a scope without the parameter part and assign that name to a client, but in addition provide some logic to parse the structure
of the scope at runtime using the *IScopeParser* interface or by deriving from our default implementation, e.g.:

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

## API Resources
When the API/resource surface gets larger, a flat list of scopes like the one used above might become hard to  manage.

In Duende IdentityServer, the *ApiResource* class allows for some additional organization as well as grouping and isolation of scopes as well as providing some common settings.

Let's use the following scope definition as an example:

```cs
public static IEnumerable<ApiScope> GetApiScopes()
{
    return new List<ApiScope>
    {
        // invoice API specific scopes
        new ApiScope(name: "invoice.read",   displayName: "Reads your invoices."),
        new ApiScope(name: "invoice.pay",    displayName: "Pays your invoices."),

        // customer API specific scopes
        new ApiScope(name: "customer.read",    displayName: "Reads you customers information."),
        new ApiScope(name: "customer.contact", displayName: "Allows contacting one of your customers."),

        // shared scopes
        new ApiScope(name: "manage",    displayName: "Provides administrative access.")
        new ApiScope(name: "enumerate", displayName: "Allows enumerating data.")
    };
}
```

With *ApiResource* you can now create two logical APIs and their corresponding scopes:

```cs
public static readonly IEnumerable<ApiResource> GetApiResources()
{ 
    return new List<ApiResource>
    {
        new ApiResource("invoice", "Invoice API")
        {
            Scopes = { "invoice.read", "invoice.pay", "manage", "enumerate" }
        },
        
        new ApiResource("customer", "Customer API")
        {
            Scopes = { "customer.read", "customer.contact", "manage", "enumerate" }
        }
    };
}
```

Using the API resource grouping gives you the following additional features

* support for the JWT *aud* claim. The value(s) of the audience claim will be the name of the API resource(s)
* support for adding common user claims across all contained scopes
* support for introspection by assigning a API secret to the resource
* support for configuring the access token signing algorithm for the resource

Let's have a look at some example access tokens for the above resource configuration.

Client requests: **invoice.read** and **invoice.pay**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": "invoice",
        "scope": "invoice.read invoice.pay"
    }
```

Client requests: **invoice.read** and **customer.read**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "invoice.read customer.read"
    }
```

Client requests: **manage**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "manage"
    }
```

### Adding user claims
You can specify that an access token for an API resource (regardless which scope is requested) should contain additional user claims, 

```cs
var customerResource = new ApiResource("customer", "Customer API")
    {
        Scopes = { "customer.read", "customer.contact", "manage", "enumerate" },
        
        // additional claims to put into access token
        UserClaims =
        {
            "department_it",
            "sales_region"
        }
    }
```

If a client would now request a scope belonging to the *customer* resource, the access token would contain the additional claims (if provided by your [profile service]({{< ref "/reference/profile_service" >}})).

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "invoice.read customer.read",

        "department_id": 5,
        "sales_region": "south"
    }
```

### Setting a signing algorithm
Your APIs might have certain requirements for the cryptographic algorithm used to sign the access tokens for that resource.
An example could be regulatory requirements, or that you are starting to migration your system to higher security algorithms.

The following sample sets *PS256* as the required signing algorithm for the *invoices* API:

```cs
var invoiceApi = new ApiResource("invoice", "Invoice API")
    {
        Scopes = { "invoice.read", "invoice.pay", "manage", "enumerate" },

        AllowedAccessTokenSigningAlgorithms = { SecurityAlgorithms.RsaSsaPssSha256 }
    }
```

{{% notice note %}}
Make sure that you have configured your IdentityServer for the required signing algorithm. See [here]({{< ref "keys" >}}) for more details.
{{% /notice %}}

### Resource isolation
If you want to make sure that a certain API resource never shares access tokens with other resources and scopes, you can enforce usage of the *resource* parameter for that resource:

```cs
var invoiceApi = new ApiResource("urn:invoice", "Invoice API")
    {
        Scopes = { "invoice.read", "invoice.pay", "manage", "enumerate" },

        // require usage of resource parameter
        RequireResourceIndicator = true
    }
```

This will require the client to obtain an access token per API resource, rather than a single access token for all of them. See [here]({{< ref "/advanced/resource_isolation" >}}) for more information on resource isolation.