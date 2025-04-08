---
title: "Dynamic Client Registration"
sidebar:
  order: 5
redirect_from:
  - /identityserver/v6/configuration/dcr/
  - /identityserver/v6/configuration/dcr/authorization/
  - /identityserver/v6/configuration/dcr/calling-registration/
  - /identityserver/v6/configuration/dcr/customization/
  - /identityserver/v6/configuration/dcr/installation/
  - /identityserver/v7/configuration/dcr/
  - /identityserver/v7/configuration/dcr/authorization/
  - /identityserver/v7/configuration/dcr/calling-registration/
  - /identityserver/v7/configuration/dcr/customization/
  - /identityserver/v7/configuration/dcr/installation/
---

Dynamic Client Registration (DCR) is the process of registering OAuth clients
dynamically. The client provides information about itself and specifies its
desired configuration in an HTTP request to the configuration endpoint. The
endpoint will then create the necessary client configuration and return an HTTP
response describing the new client, if the request is authorized and valid.

DCR eliminates the need for a manual registration process, making it more
efficient and less time-consuming to register new clients.

## Installation and Hosting

The Configuration API can be installed in a separate host from IdentityServer,
or in the same host. In many cases it is desirable to host the configuration API
and IdentityServer separately. This facilitates the ability to restrict access
to the configuration API at the network level separately from IdentityServer and
keeps IdentityServer's access to the configuration data read-only. In other
cases, you may find that hosting the two systems together better fits your
needs.

### Separate Host for Configuration API

To host the configuration API separately from IdentityServer:

#### Create a new empty web application

```bash title=Terminal
dotnet new web -n Configuration
```

#### Add the Duende.IdentityServer.Configuration package

```bash title=Terminal
cd Configuration
dotnet add package Duende.IdentityServer.Configuration
```

#### Configure Services

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>";
);
```

The Configuration API feature is included in the IdentityServer Business edition
license and higher. Use the same license key for IdentityServer and the
Configuration API.

#### Add and configure the store implementation

The Configuration API uses the `IClientConfigurationStore` abstraction to
persist new clients to the configuration store. Your Configuration API host
needs an implementation of this interface. You can either use the built-in
Entity Framework based implementation, or implement the interface yourself. See
[the IClientConfigurationStore reference](/identityserver/reference/stores/) for
more details. If you wish to use the built-in implementation, install its NuGet
package and add it to DI.

```bash title=Terminal
dotnet add package Duende.IdentityServer.Configuration.EntityFramework
```

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>"
).AddClientConfigurationStore();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddConfigurationDbContext<ConfigurationDbContext>(options =>
{
    options.ConfigureDbContext = builder => builder.UseSqlite(connectionString);
});
```

#### Map Configuration Endpoints

```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");
```

`MapDynamicClientRegistration` registers the DCR endpoints and returns an
`IEndpointConventionBuilder` which you can use to define authorization
requirements for your DCR endpoint. See [Authorization](/identityserver/apis/aspnetcore/authorization/) for more details.

## Shared Host for Configuration API and IdentityServer

To host the configuration API in the same host as IdentityServer:

#### Add the Duende.IdentityServer.Configuration package

```bash title=Terminal
dotnet add package Duende.IdentityServer.Configuration
```

#### Add the Configuration API's services to the service collection:

```cs
builder.Services.AddIdentityServerConfiguration();
```

#### Add and configure the store implementation

The Configuration API uses the `IClientConfigurationStore` abstraction to
persist new clients to the configuration store. Your Configuration API host
needs an implementation of this interface. You can either use the built-in
Entity Framework-based implementation, or implement the interface yourself. See
[the IClientConfigurationStore reference](/identityserver/reference/stores/client-store/) for
more details. If you wish to use the built-in implementation, install its NuGet
package and add it to DI.

```bash title=Terminal
dotnet add package Duende.IdentityServer.Configuration.EntityFramework
```

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>"
).AddClientConfigurationStore();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddConfigurationDbContext<ConfigurationDbContext>(options =>
{
    options.ConfigureDbContext = builder => builder.UseSqlite(connectionString);
});
```

#### Map Configuration Endpoints:

```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");

```

`MapDynamicClientRegistration` registers the DCR endpoints and returns an
`IEndpointConventionBuilder` which you can use to define authorization
requirements for your DCR endpoint. See [Authorization](/identityserver/apis/aspnetcore/authorization/) for more details.

## Authorization

You should consider your requirements and design authentication and
authorization policy for the Configuration API, if required. The specifications
that define DCR envision both open registration, where authentication and
authorization are absent and all client software can register with the
authorization server, and protected registration, where an initial access token
is required in order to register.

The Configuration API creates standard ASP.NET endpoints that can be protected
through traditional ASP.NET authorization. Alternatively, the dynamic client
registration `software_statement` parameter can be used to authenticate requests.

### Traditional ASP.NET Authorization

You can authorize access to the Configuration API Endpoints using [authorization
policies](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies)
just like any other endpoint created in an ASP.NET Web application. That
authorization policy can use any criteria that an authorization policy might
enforce, such as checking for particular claims or scopes.

One possibility is to authenticate the provisioning system, that is, the system
making the DCR call, using OAuth. The resulting access token could include a
scope that grants access to the Configuration API.

For example, you might protect the Configuration APIs with a JWT-bearer
authentication scheme and an authorization policy that requires a particular
scope to be present in the JWTs. You could choose any name for the scope that
gives access to the Configuration APIs. Let's use the name
"IdentityServer.Configuration" for this example. You would then define the
"IdentityServer.Configuration" scope as an [ApiScope](/identityserver/reference/models/api-scope/) in your
IdentityServer and allow the
appropriate clients to access it. An automated process running in a CI pipeline
could be configured as an OAuth client that uses the client credentials flow and
is allowed to request the "IdentityServer.Configuration" scope. It could obtain
a token using its client id and secret and then present that token when it calls
the Configuration API. You might also have an interactive web application with a
user interface that makes calls to the Configuration API. Again, you would
define the application as an OAuth client allowed to request the appropriate
scope, but this time, you'd use the authorization code flow.

### Software Statement

The metadata within requests to the Configuration API can be bundled together
into a JWT and sent in the `software_statement` parameter. If you can establish
a trust relationship between the Configuration API and the issuer of the
software statement, then that can be used to decide if you want to accept
registration requests.

In order to use a software statement in this way, you would need to design the
specific semantics of your software statements, how you will issue them, how you
will create the necessary trust relationship between the issuer and your
Configuration API, and how the Configuration API will validate the software
statements. The configuration API doesn't make any assumptions about that
design. By default, it does nothing with the *software_statement parameter*.
To make use of it, customize the
`DynamicClientRegistrationValidator.ValidateSoftwareStatementAsync` extension
point.

## Calling the Registration Endpoint

The registration endpoint is invoked by making an HTTP POST request to the /connect/dcr endpoint with a json payload
containing metadata describing the desired client as described in [RFC 7591](https://datatracker.ietf.org/doc/rfc7591/)
and [OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html).

The supported metadata properties are listed in the reference section on the [
`DynamicClientRegistrationRequest` model](/identityserver/reference/dcr/models/#dynamicclientregistrationrequest). A mixture of standardized
and IdentityServer-specific properties are supported. Most standardized properties that are applicable to the client
credentials or code flow grants (the two grants we support) are supported. Where IdentityServer's configuration model
includes important properties that are not standardized, we have included those properties as extensions. For example,
there are no standardized properties describing token lifetimes, so the dynamic client registration endpoint adds
`absolute_refresh_token_lifetime`, `access_token_lifetime`, `identity_token_lifetime`, etc.

## Customization

The behavior of the Configuration API can be customized through the use of
several extension points that control the steps that occur when a dynamic client
registration request arrives.

First, the incoming request is validated to ensure that it is syntactically
valid and semantically correct. The result of the validation process is a model
which will either contain error details or a validated `Client` model.

When validation succeeds, the validated request is passed on to the request
processor. The request processor is responsible for generating properties of the
`Client` that are not specified in the request. For example, the `client_id` is
not normally specified in the request and is instead generated by the processor.

When the processor is finished generating values, it passes the final client
object to the store and returns an `IDynamicClientRegistrationResponse`
indicating success or failure. This response object is finally used by the
response generator to generate an HTTP response.

Each of the validation and processing steps might also encounter an error. When
that occurs, errors are conveyed using the `DynamicClientRegistrationError`
class.

### Validation

To customize the validation process, you can either implement the `IDynamicClientRegistrationValidator` interface or
extend from the default implementation of that interface, the `DynamicClientRegistrationValidator`. The default
implementation includes many virtual methods, allowing you to use most of the base functionality and add your
customization in a targeted manner.

Each virtual method is responsible for validating a small number of parameters in the request and setting corresponding
values on the client. The steps are passed a context object containing the client object that is being built up, the
original request, the claims principal that made the request, and a dictionary of additional items that can be used to
pass state between customized steps. Each step should update the client in the context and return an `IStepResult` to
indicate success or failure.

For more details, see the [reference section on validation](/identityserver/reference/dcr/validation/)

### Processing

In a similar way, the request processor can be customized by implementing an
`IDynamicClientRegistrationRequestProcessor` or by extending from the default
`DynamicClientRegistrationRequestProcessor`. Again, the default request processor contains virtual methods that allow
you to override a part of its functionality.

For more details, see the [reference section on request processing](/identityserver/reference/dcr/processing/)

### Response Generation

Finally, to customize the HTTP responses of the Configuration API, you can implement the
`IDynamicClientRegistrationResponseGenerator` or extend from the default `DynamicClientRegistrationResponseGenerator`.

For more details, see the [reference section on response generation](/identityserver/reference/dcr/response/)