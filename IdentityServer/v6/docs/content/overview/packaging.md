---
title: "Packaging and Builds"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

### Product
You can find the Duende IdentityServer source code on [GitHub](https://github.com/duendesoftware/IdentityServer).

This repo is the source for the following main product Nuget packages:

* [Duende IdentityServer](https://www.nuget.org/packages/Duende.IdentityServer)
* [Duende IdentityServer EntityFramework Integration](https://www.nuget.org/packages/Duende.IdentityServer.EntityFramework)
* [Duende IdentityServer ASP.NET Identity Integration](https://www.nuget.org/packages/Duende.IdentityServer.AspNetIdentity)

### UI
Duende IdentityServer does not contain any UI, because this is always custom to the project. 
We still provide you a starting point for your modifications.

* [standard](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI) UI
* UI with ASP.NET Identity [integration](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI.AspNetIdentity)

### Templates
Contains templates for the dotnet CLI.

* Nuget [package](https://www.nuget.org/packages/Duende.IdentityServer.Templates)
* [source code](https://github.com/DuendeSoftware/IdentityServer.Templates)

You can install the templates using the following command:

```
dotnet new -i Duende.IdentityServer.Templates
```

### Dev builds
In addition we publish CI builds to our package repository.
Add the following *nuget.config* to your project to access the CI feed:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <packageSources>
        <add key="Duende IdentityServer CI" value="https://www.myget.org/F/duende_identityserver/api/v3/index.json" />
    </packageSources>
</configuration>
```
