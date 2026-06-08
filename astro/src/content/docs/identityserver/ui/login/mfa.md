---
title: "Multi-Factor Authentication"
description: "Overview of multi-factor authentication (MFA) options in IdentityServer, including Duende User Management's built-in TOTP, passkeys, and OTP support, as well as ASP.NET Core Identity and federation scenarios."
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/ui/login/mfa/
  - /identityserver/v6/ui/login/mfa/
  - /identityserver/v7/ui/login/mfa/
---

Multi-factor authentication (MFA) requires users to prove their identity with more than one factor: typically something 
they know (a password) combined with something they have (a device or security key) or something they are (a biometric). 
IdentityServer handles the protocol layer (OpenID Connect, OAuth 2.0, SAML) and delegates the actual authentication 
experience, including MFA, to the hosting application's login UI.

## MFA with Duende User Management

[Duende User Management](/identityserver/usermanagement/index.mdx) provides production-ready MFA building blocks that integrate 
directly with IdentityServer. The library handles the cryptographic operations, credential storage, verification logic, 
and rate limiting. You provide the UI.

Supported second factors:

| Method | Description | Use Case |
|--------|-------------|----------|
| **TOTP** | Time-based codes from authenticator apps (Microsoft Authenticator, Google Authenticator, etc.) | Most common MFA for enterprise apps |
| **Passkeys** | WebAuthn/FIDO2 phishing-resistant authentication via biometrics or hardware keys | Highest security; can also serve as primary auth |
| **OTP** | One-time codes delivered via email or SMS | Step-up authentication or passwordless primary |
| **Recovery Codes** | Single-use backup codes | Fallback when the primary 2FA method is unavailable |

A typical MFA flow with User Management:

1. User authenticates with a primary factor (password, OTP, or external provider)
2. Application checks whether the user has a second factor enrolled
3. User completes the second-factor challenge (TOTP code, passkey ceremony, etc.)
4. Application establishes the IdentityServer session with an `amr` claim reflecting MFA being used

```csharp
// Login.cshtml.cs
public class LoginModel(
    IUserAuthenticatorsSelfService authenticatorsSelfService) 
    : PageModel
{
    public async Task<IActionResult> AfterPrimaryAuthSucces(UserSubjectId userId, CancellationToken ct)
    {
        var authenticators = await authenticatorsSelfService.TryGetAsync(userId, ct);
    
        if (authenticators?.TotpDeviceNames.Count > 0)
        {
            // Redirect to TOTP verification page
            return RedirectToPage("/LoginWith2FA");
        }
    
        if (authenticators?.Passkeys.Count > 0)
        {
            // Redirect to passkey verification page
            return RedirectToPage("/LoginWithPasskey");
        }
        
        return RedirectToPage("/LoginWithRecoveryCode");
    }
}
```

For detailed implementation guides, see:

- [Authentication Flows Overview](/identityserver/usermanagement/authentication/overview.mdx): choosing the right combination of methods
- [TOTP Authentication](/identityserver/usermanagement/authentication/totp.mdx): setup, verification, and recovery codes
- [Passkey Authentication](/identityserver/usermanagement/authentication/passkeys.mdx): WebAuthn ceremonies and second-factor configuration
- [OTP Authentication](/identityserver/usermanagement/authentication/otp.mdx): passwordless codes via email or SMS
- [Recovery Codes](/identityserver/usermanagement/authentication/recovery-codes.mdx): backup access when the primary second factor is unavailable

## MFA with ASP.NET Core Identity

If you are using [ASP.NET Core Identity](/identityserver/aspnet-identity/index.md) as your user store, it provides its 
own [MFA support](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-enable-qrcodes) including 
TOTP with authenticator apps.
Microsoft's [general MFA guidelines](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/mfa) cover 
configuration options for ASP.NET Core.

## MFA and External Authentication

When using IdentityServer as a [federation gateway](/identityserver/ui/federation.md), interactive users authenticate at 
the upstream identity provider. The upstream provider handles the entire authentication process, including any MFA it 
requires. No special configuration is needed in IdentityServer for this scenario.

## Requesting MFA from Clients

Clients can signal that MFA is required using the `acr_values` parameter in the authorization request. 
Your login UI can read this from the [authorization context](/identityserver/ui/login/context) and enforce a second-factor 
challenge accordingly:

```csharp
var context = await interaction.GetAuthorizationContextAsync(returnUrl, HttpContext.RequestAborted);

if (context?.AcrValues.Contains("mfa") == true)
{
    // Enforce second-factor authentication regardless of user preference
}
```
