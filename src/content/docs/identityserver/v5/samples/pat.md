---
title: "Personal Access Tokens (PAT)"
date: 2020-09-10T08:22:12+02:00
weight: 50
newContentUrl: "https://docs.duendesoftware.com/identityserver/v7/samples/tokens/"
---

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v5/PAT)

This sample shows how to provide a self-service UI to create access tokens. This is a common approach to enable integrations with APIs without having to create full-blown OAuth clients.

When combining PATs with the [reference token](/identityserver/v5/tokens/reference) feature, you also get automatic validation and revocation support. This is very similar to API keys, but does not require custom infrastructure. The sample also contains an API that accepts both JWT and reference tokens.
