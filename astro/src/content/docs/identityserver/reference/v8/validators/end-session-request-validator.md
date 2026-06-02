---
title: "End Session Request Validator"
description: Reference for the EndSessionRequestValidator class and how to subclass it to customize id_token_hint validation during RP-Initiated Logout (end session) requests.
date: 2026-05-22
sidebar:
  label: End Session Validator
  order: 50
---

#### Duende.IdentityServer.Validation.EndSessionRequestValidator

The built-in validator for RP-Initiated Logout (end session) requests. When a client sends a logout request 
with an `id_token_hint` parameter, this validator checks that the hint matches the currently authenticated 
user's session before proceeding with logout. You can subclass it to customize that matching logic.

## ValidateIdTokenHintAsync

The main extensibility point is the `ValidateIdTokenHintAsync` method:

```csharp
// EndSessionRequestValidator.cs
protected virtual Task<EndSessionHintValidationResult> ValidateIdTokenHintAsync(
    EndSessionHintValidationContext context, CancellationToken ct)
```

Override this method to apply your own logic for deciding whether the `id_token_hint` in the logout 
request matches the current user session. The method receives an `EndSessionHintValidationContext`
and returns an `EndSessionHintValidationResult`.

## EndSessionHintValidationContext

The context object gives you everything you need to make the validation decision:

* **`Subject`** (`ClaimsPrincipal`) - the currently authenticated user, taken from the active session. Use this to read the user's claims, such as their subject ID.

* **`TokenValidationResult`** - the result of validating the `id_token_hint` JWT. This includes all claims from the token (for example, `sub`, `sid`, `aud`) and a reference to the associated client. If the token was invalid, this step would have already failed before your override is called.

* **`SessionId`** (`string?`, may be `null`) - the current session identifier. This corresponds to the `sid` claim in tokens issued for this session. It can be `null` if the session does not have a session ID.

## EndSessionHintValidationResult

Your override must return one of three factory results:

* **`EndSessionHintValidationResult.Valid()`** - the hint matches the current session. Logout proceeds without showing a confirmation prompt to the user (assuming the client has not requested one).

* **`EndSessionHintValidationResult.Invalid(errorMessage)`** - the hint does not match the current session. The request is rejected with the provided error message.

* **`EndSessionHintValidationResult.RequiresConfirmation()`** - the match is uncertain. Logout proceeds, but IdentityServer sets `ShowSignoutPrompt` to `true`, so the user sees a confirmation prompt before being signed out.

:::caution[Security Warning]
Returning `Valid()` unconditionally (e.g., accepting any `id_token_hint` regardless of whether the `sub` or `sid` matches)
creates a cross-user logout vector. An attacker who holds any valid `id_token_hint` (for example, one issued for their own account)
can silently log out other users when the signout prompt is suppressed. Any custom override must apply appropriate
validation logic and should not skip the subject or session comparison without a deliberate reason.
:::

## Default Behavior

The default implementation uses a sid-first strategy:

1. If the `id_token_hint` contains a `sid` claim and the current session has a `SessionId`, those two values are compared. If they match, the result is `Valid()`. If they do not match, the result is `Invalid()`.
2. If no `sid` claim is present in the token, or the current session has no `SessionId`, the validator falls back to comparing the `sub` claim in the token against the authenticated user's subject ID. If they match, the result is `Valid()`. If they do not match, the result is `Invalid()`.
3. If neither a `sid` nor a `sub` claim is present in the token, the hint is treated as valid and `Valid()` is returned.

## Registration

Subclass `EndSessionRequestValidator` and register your subclass in DI, replacing the built-in registration:

```csharp
// Program.cs
builder.Services.AddTransient<EndSessionRequestValidator, CustomEndSessionRequestValidator>();
```

IdentityServer resolves `EndSessionRequestValidator` directly, so registering your subclass under the base class type is all you need.

## Examples

### Always prompt when only sub matches

This override tightens the default behavior for the case where the token has no `sid` claim.
Instead of returning `Valid()` when only the `sub` matches, it returns `RequiresConfirmation()`,
so the user always sees a confirmation prompt in that situation.

```csharp
// CustomEndSessionRequestValidator.cs
public class CustomEndSessionRequestValidator : EndSessionRequestValidator
{
    protected override Task<EndSessionHintValidationResult> ValidateIdTokenHintAsync(
        EndSessionHintValidationContext context, CancellationToken ct)
    {
        var tokenClaims = context.TokenValidationResult.Claims;

        // If the token has a sid claim and the session has a session ID, compare them.
        var tokenSid = tokenClaims.FirstOrDefault(c => c.Type == "sid")?.Value;
        if (tokenSid != null && context.SessionId != null)
        {
            return Task.FromResult(
                tokenSid == context.SessionId
                    ? EndSessionHintValidationResult.Valid()
                    : EndSessionHintValidationResult.Invalid("Session ID mismatch"));
        }

        // No sid available - fall back to sub comparison, but require confirmation
        // instead of silently accepting the match.
        var tokenSub = tokenClaims.FirstOrDefault(c => c.Type == "sub")?.Value;
        if (tokenSub != null)
        {
            var userSub = context.Subject.FindFirst("sub")?.Value;
            if (tokenSub != userSub)
            {
                return Task.FromResult(
                    EndSessionHintValidationResult.Invalid("Subject mismatch"));
            }

            // Sub matches but no sid - prompt the user to confirm logout.
            return Task.FromResult(EndSessionHintValidationResult.RequiresConfirmation());
        }

        // No sub or sid in the token - treat as valid.
        return Task.FromResult(EndSessionHintValidationResult.Valid());
    }
}
```
