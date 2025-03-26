---
title: "Backend for Frontend Pattern"
weight: 40
---

This section contains a collection of clients using our [BFF security framework](/identityserver/v6/bff).

### JavaScript Frontend
This sample shows how to use the BFF framework with a JavaScript-based frontend (e.g. SPA).

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/JsBffSample)

### ReactJs Frontend
This sample shows how to use the BFF framework with the .NET 6 React template.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/ReactBffSample)

### Angular Frontend
This sample shows how to use the BFF framework with the .NET 6 Angular template.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/AngularBffSample)

### Blazor WASM
This sample shows how to use the BFF framework with Blazor WASM.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/BlazorWasm)

### YARP Integration
This sample shows how to use the BFF extensions for Microsoft YARP

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/JsBffYarpSample)

### Separate Host for UI
This sample shows how to have separate projects from the frontend and backend, using CORS to allow cross-site requests from the frontend to the backend.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/SplitHosts)

### DPoP
This sample shows how to configure the BFF to use [DPoP](/identityserver/v6/tokens/pop/dpop) to obtain sender-constrained tokens.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/DPoP)

### Token Exchange using the IAccessTokenRetriever
This sample shows how to extend the BFF with an *IAccessTokenRetriever*. This example of an IAccessTokenRetriever performs token exchange for impersonation. If you are logged in as alice you will get a token for bob, and vice versa.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/BFF/TokenExchange)