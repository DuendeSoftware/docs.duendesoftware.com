---
title: Authorization
weight: 20
---

You should consider your requirements and design authentication and
authorization policy for the Configuration API, if required. The specifications
that define DCR envision both open registration, where authentication and
authorization are absent and all client software can register with the
authorization server, and protected registration, where an initial access token
is required in order to register.

The Configuration API creates standard ASP.NET endpoints that can be protected
through traditional ASP.NET authorization. Alternatively, the dynamic client
registration software_statement parameter can be used to authenticate requests.

## Traditional ASP.NET Authorization
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
"IdentityServer.Configuration" scope as an [ApiScope]({{< ref
"/reference/models/api_scope">}}) in your IdentityServer and allow the
appropriate clients to access it. An automated process running in a CI pipeline
could be configured as an OAuth client that uses the client credentials flow and
is allowed to request the "IdentityServer.Configuration" scope. It could obtain
a token using its client id and secret and then present that token when it calls
the Configuration API. You might also have an interactive web application with a
user interface that makes calls to the Configuration API. Again, you would
define the application as an OAuth client allowed to request the appropriate
scope, but this time, you'd use the authorization code flow. 

## Software Statement
The metadata within requests to the Configuration API can be bundled together
into a JWT and sent in the *software_statement* parameter. If you can establish
a trust relationship between the Configuration API and the issuer of the
software statement, then that can be used to decide if you want to accept
registration requests. 

In order to use a software statement in this way, you would need to design the
specific semantics of your software statements, how you will issue them, how you
will create the necessary trust relationship between the issuer and your
Configuration API, and how the Configuration API will validate the software
statements. The configuration API doesn't make any assumptions about that
design. By default it does nothing with the *software_statement parameter*; to
make use of it, [customize]({{< ref "./customization#validation" >}}) the
*DynamicClientRegistrationValidator.ValidateSoftwareStatementAsync* extension
point.
