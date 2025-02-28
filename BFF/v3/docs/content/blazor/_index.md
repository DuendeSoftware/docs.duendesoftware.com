+++
title = "Blazor applications"
weight = 100
chapter = true
+++

# Blazor support in the BFF Security Framework

Microsoft Blazor is a framework for building interactive web applications using C# and .NET. Blazor allows developers to create rich, dynamic web UIs with the same ease as building desktop applications. 

The Duende BFF (Backend for Frontend) Security Framework addresses common security challenges faced by Blazor applications. It provides a unified approach to managing authentication and authorization, ensuring secure interactions between the client and server. 

## Architecture

The following diagram shows how the support for Blazor applications in the Duende BFF Security Framework works:

![](../images/bff_blazor.svg)

The BFF exposes endpoints to perform login / logout functionality. The actual authentication (to an identity server) is handled by the **OpenIDConnectHandler**. Once succesfully authenticated, the CookieAuthenticationHandler stores a secure, httponly cookie in the browser. This cookie is then responsible for authenticating all requests from the front-end to the BFF. 

## Handling the various blazor rendering modes

Blazor is very flexible in how it renders applications (and even individual components) and where code is actually executed:

* **Server Side Rendering**: All rendering (and interactivity) happens on the server. 
* **Interactive Server Side Rendering**: All rendering happens on the server, but a streaming connection to the server allows parts of the UI to be updated when the user interacts with the application. This does mean that all interactivity still actually executes on the server. 
* **WASM** It's possible to create web assembly components that render completely in the browser. All interactivity is executed in the browser. 
* **Auto** It's even possible to create components that initially render on the server, but then transition to WASM based rendering (and interactivity) when the WASM Components have been downloaded by the browser. 

These rendering modes are very powerful, but also add additional complexity when it comes to authentication and authorization. Any code that executes on the server can directly access local resources, such has a database, but code that executes on the client needs to through a local http endpoint (that requires authentication). Accessing external api's is also different between server and client, where the client needs to go through a proxy which performs a token exchange. 


### BFF Server Authentication State Provider

When Blazor components, executing on the server needs to access authentication state, this is created by the **ServerAuthenticationStateProvider**. This reads the authentication state 

### BFF Client Authentication State Provider

### Server Side Token Store

## Management Claims

