---
title: Samples
sidebar:
  order: 150
---

We have a collection of runnable samples that show how to use IdentityServer and configure client applications in a variety of scenarios. Most of the samples include both their own IdentityServer implementation and the
clients and APIs needed to demonstrate the illustrated functionality. The "Basics" samples use a [shared IdentityServer implementation](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/IdentityServer), and some of the BFF samples use our public [demo instance of IdentityServer](https://demo.duendesoftware.com/).

This section contains a collection of clients using our BFF security framework.

## JavaScript Frontend
This sample shows how to use the BFF framework with a JavaScript-based frontend (e.g. SPA).

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/JsBffSample)

## ReactJs Frontend
This sample shows how to use the BFF framework with the .NET 6 React template.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/React)

## Angular Frontend
This sample shows how to use the BFF framework with the .NET 6 Angular template.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/Angular)

## Blazor WASM
This sample shows how to use the BFF framework with Blazor WASM.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/BlazorWasm)

## YARP Integration
This sample shows how to use the BFF extensions for Microsoft YARP

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/JsBffYarpSample)

## Separate Host for UI
This sample shows how to have separate projects from the frontend and backend, using CORS to allow cross-site requests from the frontend to the backend.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/SplitHosts)

## DPoP
This sample shows how to configure the BFF to use [DPoP](/identityserver/v7/tokens/pop#enabling-dpop-in-identityserver) to obtain sender-constrained tokens.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/DPoP)

## Token Exchange using the IAccessTokenRetriever
This sample shows how to extend the BFF with an *IAccessTokenRetriever*. This example of an IAccessTokenRetriever performs token exchange for impersonation. If you are logged in as alice you will get a token for bob, and vice versa.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2/TokenExchange)

The source code for the samples is in our samples [repository](https://github.com/DuendeSoftware/Samples/tree/main/BFF/v2).

Feel free to [ask the developer community](https://github.com/DuendeSoftware/community/discussions) if you are looking for a particular sample and can't find it here.
