---
title: "DPoP Proof Validator"
description: Documentation for the IDPoPProofValidator interface which validates Demonstrating Proof of Possession (DPoP) tokens to ensure secure binding between access tokens and client key pairs.
sidebar:
  label: DPoP Proof
  order: 40
redirect_from:
  - /identityserver/v5/reference/validators/dpop_proof_validator/
  - /identityserver/v6/reference/validators/dpop_proof_validator/
  - /identityserver/v7/reference/validators/dpop_proof_validator/
  - /identityserver/reference/validators/dpop-proof-validator/
---

#### Duende.IdentityServer.Validation.IDPoPProofValidator

The `IDPoPProofValidator` interface is used to validate [DPoP](/identityserver/tokens/pop.md) proof tokens
submitted to IdentityServer.
A default implementation is provided and can be overridden as necessary.

## IDPoPProofValidator APIs

- **`ValidateAsync`**

  Validates a DPoP proof token with the provided `DPoPProofValidationContext` for the current request.
  Returns a `DPoPProofValidationResult` object.

```csharp
Task<DPoPProofValidationResult> ValidateAsync(DPoPProofValidationContext context, CancellationToken ct);
```

### DPoPProofValidationContext

Models the information used to validate a DPoP proof token.

- **`ExpirationValidationMode`**

  Enum setting to control validation for the DPoP proof token expiration. Supports both the
  client-generated `iat` value and/or the server-generated `nonce` value. Defaults to
  `DPoPTokenExpirationValidationMode.Iat`.

- **`ClientClockSkew`**

  Clock skew used in validating the DPoP proof token `iat` claim value. Defaults to _5 minutes_.

- **`Url`**

  The HTTP URL to validate in the DPoP proof.

- **`Method`**

  The HTTP method to validate in the DPoP proof.

- **`ProofToken`**

  The DPoP proof token string to validate.

- **`ValidateAccessToken`**

  If `true`, the access token will also be validated against the proof.

- **`AccessToken`**

  The access token string to validate when `ValidateAccessToken` is `true`.

- **`AccessTokenClaims`**

  The claims associated with the access token, used when `ValidateAccessToken` is `true`. Provided
  separately from `AccessToken` because resolving claims from a reference token may be expensive.

### DPoPProofValidationResult

Models the result of a DPoP proof token validation.

- **`IsError`**

  Flag to indicate if validation failed.

- **`Error`**

  The error code if the validation failed.

- **`ErrorDescription`**

  The error description if the validation failed.

- **`JsonWebKey`**

  The serialized JWK from the validated DPoP proof token.

- **`JsonWebKeyThumbprint`**

  The JWK thumbprint from the validated DPoP proof token.

- **`Confirmation`**

  The 'cnf' value for the DPoP proof token.

- **`Payload`**

  The payload values of the DPoP proof token.

- **`TokenId`**

  The 'jti' value read from the payload.

- **`Nonce`**

  The 'nonce' value read from the payload.

- **`IssuedAt`**

  The 'iat' value read from the payload.

- **`ServerIssuedNonce`**

  The 'nonce' value issued by the server that should be emitted on the response.
