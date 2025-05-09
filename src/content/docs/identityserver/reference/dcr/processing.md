---
title: "Request Processing"
description: "Understand how dynamic client registration requests are processed, including client ID and secret generation, through the IDynamicClientRegistrationRequestProcessor contract and its default implementation."
sidebar:
  order: 20
redirect_from:
  - /identityserver/v5/configuration/dcr/reference/processing/
  - /identityserver/v6/configuration/dcr/reference/processing/
  - /identityserver/v7/configuration/dcr/reference/processing/
---

The page explains the `IDynamicClientRegistrationRequestProcessor` contract, its default implementation (
`DynamicClientRegistrationRequestProcessor`), and the steps involved in processing a dynamic client registration
request, including methods for generating client IDs, secrets, and customizing secret generation.

## IDynamicClientRegistrationRequestProcessor

The `IDynamicClientRegistrationValidator` is the contract for the service that
processes a dynamic client registration request. It contains a single
`ProcessAsync(...)` method.

Conceptually, the request processing step is responsible for setting properties
on the `Client` model that are generated by the Configuration API itself. In
contrast, the `IDynamicClientRegistrationRequestProcessor` is responsible for
checking the validity of the metadata supplied in the registration request, and
using that metadata to set properties of a `Client` model. The request processor
is also responsible for passing the finished `Client` to the [store](/identityserver/reference/dcr/store/)

### Members

| name            | description                                                                                                                                                                                 |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ProcessAsync(…) | Processes a valid dynamic client registration request, setting properties of the client that are not specified in the request, and storing the new client in the IClientConfigurationStore. |

## DynamicClientRegistrationRequestProcessor

The `DynamicClientRegistrationRequestProcessor` is the default implementation of the
`IDynamicClientRegistrationRequestProcessor`. If you need to customize some aspect
of Dynamic Client Registration request processing, we recommend that you extend this
class and override the appropriate virtual methods.

```csharp
public class DynamicClientRegistrationRequestProcessor : IDynamicClientRegistrationRequestProcessor
```

## Request Processing Steps

Each of these virtual methods represents one step of request processing.
Each step is passed a [DynamicClientRegistrationContext](/identityserver/reference/dcr/models/#dynamicclientregistrationcontext) and returns a task
that returns an [`IStepResult`](/identityserver/reference/dcr/models/#istepresult). The `DynamicClientRegistrationContext` includes the client model
that will
have its properties set, the DCR request, and other contextual information. The
`IStepResult` either represents that the step succeeded or failed.

| name                    | description                                                               |
|-------------------------|---------------------------------------------------------------------------|
| virtual AddClientId     | Generates a client ID and adds it to the validatedRequest's client model. |
| virtual AddClientSecret | Adds a client secret to a dynamic client registration request.            |

## Secret Generation

The `AddClientSecret` method is responsible for adding the client's secret and
plaintext of that secret to the context's `Items` dictionary for later use. If you want to customize secret generation,
you can override the GenerateSecret method, which only needs to return a tuple containing the secret and
its plaintext.

| name                   | description                                                   |
|------------------------|---------------------------------------------------------------|
| virtual GenerateSecret | Generates a secret for a dynamic client registration request. |