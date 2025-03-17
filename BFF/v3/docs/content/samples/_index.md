+++
title = "Samples"
weight = 150
chapter = true
+++

# Samples

This section contains a collection of clients using our [BFF security framework]({{< ref "/" >}}).

### JavaScript Frontend
This sample shows how to use the BFF framework with a JavaScript-based frontend (e.g. SPA).

[link to source code]({{< param samples_base >}}/JsBffSample)

### ReactJs Frontend
This sample shows how to use the BFF framework with the .NET 6 React template.

[link to source code]({{< param samples_base >}}/React)

### Angular Frontend
This sample shows how to use the BFF framework with the .NET 6 Angular template.

[link to source code]({{< param samples_base >}}/Angular)

### Blazor WASM
This sample shows how to use the BFF framework with Blazor WASM.

[link to source code]({{< param samples_base >}}/BlazorWasm)

### Blazor Auto Rendering
This sample shows how to use Authentication in combination with Blazor's AutoRendering feature. 

[link to source code]({{< param samples_base >}}/BlazorAutoRendering)


### YARP Integration
This sample shows how to use the BFF extensions for Microsoft YARP

[link to source code]({{< param samples_base >}}/JsBffYarpSample)

### Separate Host for UI
This sample shows how to have separate projects from the frontend and backend, using CORS to allow cross-site requests from the frontend to the backend.

[link to source code]({{< param samples_base >}}/SplitHosts)

### DPoP
This sample shows how to configure the BFF to use [DPoP]({{<ref-idsrv "/tokens/pop/dpop">}}) to obtain sender-constrained tokens.

[link to source code]({{< param samples_base >}}/DPoP)

### Token Exchange using the IAccessTokenRetriever
This sample shows how to extend the BFF with an *IAccessTokenRetriever*. This example of an IAccessTokenRetriever performs token exchange for impersonation. If you are logged in as alice you will get a token for bob, and vice versa.

[link to source code]({{< param samples_base >}}/TokenExchange)

## Feedback
Feel free to [ask the developer community](https://github.com/DuendeSoftware/community/discussions) if you are looking for a particular sample and can't find it here.
