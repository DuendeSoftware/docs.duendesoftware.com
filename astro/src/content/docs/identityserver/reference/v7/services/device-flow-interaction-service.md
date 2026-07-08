---
title: "Device Flow Interaction Service"
description: Documentation for the IDeviceFlowInteractionService interface which provides services for user interfaces to communicate with IdentityServer during device flow authorization.
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Device Flow Interaction
  order: 65
redirect_from:
  - /identityserver/v7/reference/services/device_flow_interaction_service/
---

#### Duende.IdentityServer.Services.IDeviceFlowInteractionService

The `IDeviceFlowInteractionService` interface is intended to provide services to be used by the user interface to
communicate with Duende IdentityServer during device flow authorization.
It is available from the dependency injection system and would normally be injected as a constructor parameter into your
MVC controllers for the user interface of IdentityServer.

## IDeviceFlowInteractionService APIs

* **`GetAuthorizationContextAsync(string userCode)`**

  Returns the `DeviceFlowAuthorizationRequest` based on the `userCode` passed to the login or consent pages.

* **`HandleRequestAsync(string userCode, ConsentResponse consent)`**

  Completes device authorization for the given `userCode`.

## DeviceFlowAuthorizationRequest

* **`Client`**

  The client that initiated the device authorization request.

* **`ValidatedResources`**

  The validated resources (scopes and resource indicators) requested by the client.

## DeviceFlowInteractionResult

* **`IsError`**

  Specifies if the authorization request errored.

* **`IsAccessDenied`**

  Gets or sets a value indicating whether the user denied access.

* **`ErrorDescription`**

  Error description upon failure.

* **`Failure(string errorDescription = null)`** *(static method)*

  Creates a `DeviceFlowInteractionResult` indicating failure with an optional error description.
