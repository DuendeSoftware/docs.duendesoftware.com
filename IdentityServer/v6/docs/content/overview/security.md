---
title: "Security best-practices"
date: 2020-09-10T08:22:12+02:00
weight: 55
---

This document describes how the integrity of software produced by Duende Software is maintained during the software development life cycle.

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
   * whenever a security vulnerability has been confirmed and fixed, customer will get a private update prior to public release.

### Dependencies

IdentityServer has two dependencies:

* [Microsoft .NET](https://dot.net)
* [IdentityModel](https://github.com/IdentityModel)
   * maintained by Duende Software using the same principles as outlined above
