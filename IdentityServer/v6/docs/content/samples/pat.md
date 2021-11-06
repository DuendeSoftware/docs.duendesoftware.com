---
title: "Personal Access Tokens (PAT)"
date: 2020-09-10T08:22:12+02:00
weight: 50
---

[link to source code]({{< param samples_base >}}/PAT)

This sample shows how to provide a self-service UI to create access tokens. This is a common approach to enable integrations with APIs without having to create full-blown OAuth clients.

When combining PATs with the [reference token]({{< ref "/tokens/reference" >}}) feature, you also get automatic validation and revocation support. This is very similar to API keys, but does not require custom infrastructure. The sample also contains an API that accepts both JWT and reference tokens.
