+++
title = "Microsoft.IdentityModel.* versions"
weight = 10
+++

Duende IdentityServer, the Microsoft external authentication handlers and other libraries all use the Microsoft.IdentityModel set of libraries. These libraries provides token and configuration handling features. The functionality is split up between different libraries and they all need to be **exactly the same version**. However this is not enfored by Nuget so it is common to end up with an application that brings in different versions of Microsoft.IdentityModel.* through transitive dependencies.

## Known Errors
Errors that we have seen because of IdentityModel version mismatches include:
* IDX10500: Signature validation failed. No security keys were provided to validate the signature.
* System.MissingMethodException: Method not found 'Boolean Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'

## Diagnosing
Run this command in powershell: `dotnet list package --include-transitive | sls "Microsoft.IdentityModel|System.IdentityModel"`

The output should look something like this:
```txt
   > Microsoft.IdentityModel.Abstractions                       7.4.0
   > Microsoft.IdentityModel.JsonWebTokens                      7.4.0
   > Microsoft.IdentityModel.Logging                            7.4.0
   > Microsoft.IdentityModel.Protocols                          7.0.3
   > Microsoft.IdentityModel.Protocols.OpenIdConnect            7.0.3
   > Microsoft.IdentityModel.Tokens                             7.4.0
   > System.IdentityModel.Tokens.Jwt                            7.0.3
```

In the above example it is clear that there are different versions active.

## Fixing
To fix this, add explicit package references to upgrade the packages that are of lower version to the most recent version used.

```
<PackageReference Include="Microsoft.IdentityModel.Protocols" Version="7.4.0" />
<PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" Version="7.4.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.4.0" />
```
