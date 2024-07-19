---
title: "Security best-practices"
date: 2020-09-10T08:22:12+02:00
weight: 55
---

This document describes how the integrity of software produced by Duende Software is maintained during the software development life cycle.

### Data processing
Our products are off-the shelf downloadable developer components. They are not managed services or SaaS - nor do we store, have access to, or process any of our customers' data or their customers' data.

### Systems access

* Multiple systems are used in the development life cycle, including GitHub, NuGet, and Microsoft Azure Key Vault.
* Multi-factor authentication is required for all services mentioned above.
* Only a limited subset of Duende Software employees act as administrators for each system.


### Software development

* All code is stored in [GitHub](https://github.com/duendesoftware).
* Any code added to a project must be added via pull request.
* At least one other staff member must review a pull request before it can be merged to a release branch.
* Static code security analysis is performed for every check-in (using GitHub [CodeQL](https://codeql.github.com/)).


### Testing

* Automated test suites are run on code in every pull request branch.
* Pull requests cannot be merged if the automated test suite fails.


### Deployment

* Merging a pull request does not immediately release new features to users, this requires an additional release step.
* All compiled software packages with associated source are available as GitHub releases.
* Compiled software libraries (such as Duende IdentityServer) are published to [NuGet](https://www.nuget.org/).
* Packages must be pushed to NuGet by a Duende Software staff member only after additional validation by the staff member.
* All NuGet packages are signed with a code signing certificate
   * The private key (RSA 4096 bits) is stored in Azure Key Vault. 
   * The private key never leaves Key Vault and the signature process is performed by Key Vault.
   * NuGet will validate the package signature with Duende's public key to verify they were legitimately built by Duende Software and have not been compromised or tampered with.
   * NuGet client tooling can be configured to accept signed packages only.
* Once on NuGet, the package is available for end users to update their own solutions.
* End users still must take explicit action to upgrade after reviewing the package's release notes.

### Vulnerability management process

* Potential security vulnerabilities can be responsibly disclosed via our [contact form](https://duendesoftware.com/contact).
   * We guarantee to reply within two US business days.
* All licenses includes a security notification service.
   * Whenever a security vulnerability has been confirmed and fixed, customers will get a private update prior to public release.
* We will publish an official advisory

### Dependencies

IdentityServer has two dependencies:

* [Microsoft .NET](https://dot.net)
* [IdentityModel](https://github.com/IdentityModel)
   * maintained by Duende Software using the same principles as outlined above

### Certification

Duende IdentityServer is a [certified](https://openid.net/certification/) implementation of OpenID Connect.

### Package Signing

NuGet packages published by Duende are cryptographically signed to ensure their
authenticity and integrity. Our certificate is signed by Sectigo, which is a widely
trusted certificate authority and installed by default in most environments. This means
that in many circumstances, the NuGet tools can validate our packages' signatures
automatically.

However, some environments (notably the dotnet sdk docker image which is
sometimes used in
build pipelines) do not trust the Sectigo certificate. Typically this isn't a problem,
because NuGet packages distributed by nuget.org are signed by nuget.org as the repository
in addition to Duende's signature as the publisher. nuget.org's certificate is signed by a
different authority that most build pipelines do trust. The NuGet tools will validate
packages if they trust either the publisher or the repository.

In the rare circumstance that we distribute a NuGet package not through nuget.org (and
therefore without a nuget.org repository signature), it might be necessary to add the
Sectigo root certificate to NuGet's code signing certificate bundle. Sectigo's root
certificate is available from Sectigo
[here](http://crt.sectigo.com/SectigoPublicCodeSigningRootR46.p7c).

#### Trusting the Sectigo certificate
Here is an example of how to configure NuGet to validate a package signed by Duende but
not signed by nuget.org in the docker dotnet sdk image - an environment that does not
trust Sectigo by default.

First, get the Sectigo certificate and convert it to PEM format:
```sh
wget http://crt.sectigo.com/SectigoPublicCodeSigningRootR46.p7c

openssl pkcs7 -inform DER -outform PEM -in SectigoPublicCodeSigningRootR46.p7c -print_certs -out sectigo.pem
```

Next, you should validate that the thumprint of the certificate is correct.
Bootstrapping trust in a certificate chain can be challenging. Fortunately, most
desktop environments already trust this certificate, so you can compare the
downloaded certificate's thumprint to the thumbprint of the certificate on a
machine that already trusts it. You should verify this independently, but for
your convenience, the thumprint is
CC:BB:F9:E1:48:5A:F6:3C:E4:7A:BF:8E:9E:64:8C:25:04:FC:31:9D. You can check the
thumbprint of the downloaded certificate with openssl:
```sh
openssl x509 -in sectigo.pem -fingerprint -sha1 -noout
```

Then append that PEM to the certificate bundle at */usr/share/dotnet/sdk/8.0.303/trustedroots/codesignctl.pem*:
```sh
cat sectigo.pem >> /usr/share/dotnet/sdk/8.0.303/trustedroots/codesignctl.pem
```
After that, NuGet packages signed by Duende can be successfully verified, even if they are not distributed by nuget.org:
```sh
dotnet nuget verify Duende.IdentityServer.7.0.x.nupkg
```
