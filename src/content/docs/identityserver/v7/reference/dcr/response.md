---
title: "Response Generation"
description: "DCR Reference"
sidebar:
  order: 40
---

## IDynamicClientRegistrationResponseGenerator
The `IDynamicClientRegistrationResponseGenerator` interface defines the contract
for a service that generates dynamic client registration responses.

```csharp
public interface IDynamicClientRegistrationResponseGenerator
```

### Members

| name                     | description                                                              |
|--------------------------|--------------------------------------------------------------------------|
| WriteBadRequestError(…)  | Writes a bad request error to the HTTP context.                          |
| WriteContentTypeError(…) | Writes a content type error to the HTTP response.                        |
| WriteProcessingError(…)  | Writes a processing error to the HTTP context.                           |
| WriteResponse(…)         | Writes a response object to the HTTP context with the given status code. |
| WriteSuccessResponse(…)  | Writes a success response to the HTTP context.                           |
| WriteValidationError(…)  | Writes a validation error to the HTTP context.                           |


## DynamicClientRegistrationResponseGenerator 

The `DynamicClientRegistrationResponseGenerator` is the default implementation of the `IDynamicClientRegistrationResponseGenerator`. If you wish to customize a particular aspect of response generation, you can extend this class and override the appropriate methods. You can also set JSON serialization options by overriding its `SerializerOptions` property.

### Members

| name                            | description                                         |
|---------------------------------|-----------------------------------------------------|
| SerializerOptions { get; set; } | The options used for serializing json in responses. |
