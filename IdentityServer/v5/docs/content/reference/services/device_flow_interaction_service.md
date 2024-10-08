---
title: "Device Flow Interaction Service"
date: 2020-09-10T08:22:12+02:00
weight: 65
---

#### Duende.IdentityServer.Services.IDeviceFlowInteractionService

The *IDeviceFlowInteractionService* interface is intended to provide services to be used by the user interface to communicate with Duende IdentityServer during device flow authorization.
It is available from the dependency injection system and would normally be injected as a constructor parameter into your MVC controllers for the user interface of IdentityServer.

## IDeviceFlowInteractionService APIs

* ***GetAuthorizationContextAsync***
    
    Returns the *DeviceFlowAuthorizationRequest* based on the *userCode* passed to the login or consent pages.

* ***HandleRequestAsync***
    
    Completes device authorization for the given *userCode*.

## DeviceFlowAuthorizationRequest

* ***ClientId***
    
    The client identifier that initiated the request.

* ***ScopesRequested***
    
    The scopes requested from the authorization request.

## DeviceFlowInteractionResult

* ***IsError***
    
    Specifies if the authorization request errored.

* ***ErrorDescription***
    
    Error description upon failure.
