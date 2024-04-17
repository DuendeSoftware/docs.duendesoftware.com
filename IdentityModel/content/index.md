Welcome to IdentityModel
========================

![image](icon.jpg){.align-center}

IdentityModel is a family of FOSS libraries for building OAuth 2.0 and
OpenID Connect clients.

IdentityModel
-------------

The base library for OIDC and OAuth 2.0 related protocol operations. It
also provides useful constants and helper methods.

Currently we support .NET Standard 2.0 / .NET Framework \> 4.6.1

-   github <https://github.com/IdentityModel/IdentityModel>
-   nuget <https://www.nuget.org/packages/IdentityModel/>
-   CI builds <https://github.com/orgs/IdentityModel/packages>

The following libraries build on top of IdentityModel, and provide
specific implementations for different applications:

IdentityModel.AspNetCore
------------------------

ASP.NET Core specific helper library for token management.

-   github <https://github.com/IdentityModel/IdentityModel.AspNetCore>
-   nuget <https://www.nuget.org/packages/IdentityModel.AspNetCore/>
-   CI builds <https://github.com/orgs/IdentityModel/packages>

IdentityModel.AspNetCore.OAuth2Introspection
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--OAuth
2.0 token introspection authentication handler for ASP.NET Core.

-   github
```
<https://github.com/IdentityModel/IdentityModel.AspNetCore.OAuth2Introspection>
```
-   nuget
```
<https://www.nuget.org/packages/IdentityModel.AspNetCore.OAuth2Introspection/>
```
-   CI builds <https://github.com/orgs/IdentityModel/packages>

IdentityModel.OidcClient
------------------------

.NET based implementation of the **OAuth 2.0 for native apps** BCP.
Certified by the OpenID Foundation.

-   github <https://github.com/IdentityModel/IdentityModel.OidcClient>
-   nuget <https://www.nuget.org/packages/IdentityModel.OidcClient>
-   CI builds <https://github.com/orgs/IdentityModel/packages>

oidc-client.js
--------------

JavaScript based implementation of the **OAuth 2.0 for browser-based
applications** BCP. Certified by the OpenID Foundation

-   github <https://github.com/IdentityModel/oidc-client-js>
-   npm <https://www.npmjs.com/package/oidc-client>

::: {.toctree maxdepth="2" hidden="" caption="IdentityModel"}
client/overview client/discovery client/token client/introspection
client/revocation client/userinfo client/dynamic\_registration
client/device\_authorize
:::

::: {.toctree maxdepth="2" hidden="" caption="IdentityModel - Misc Helpers"}
misc/constants misc/request\_url misc/x509store misc/base64
misc/epoch\_time misc/time\_constant\_comparison
:::

::: {.toctree maxdepth="2" hidden="" caption="IdentityModel for Workers and Web Apps"}
aspnetcore/overview aspnetcore/worker aspnetcore/web
aspnetcore/extensibility
:::

::: {.toctree maxdepth="2" hidden="" caption="Building mobile/native Clients"}
native/overview native/manual native/automatic native/logging
native/samples
:::

::: {.toctree maxdepth="2" hidden="" caption="Building JavaScript Clients"}
js/overview
:::

