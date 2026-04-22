---
title: "Troubleshooting"
description: "Diagnose and fix common problems with Duende BFF: anti-forgery failures, CORS errors, session expiration, YARP misconfigurations, Blazor token issues, and more."
sidebar:
  order: 90
---

This page covers the most common problems encountered when building and operating a Duende BFF application. Each scenario is described in **symptom → cause → solution** format.

---

### Symptom: Anti-Forgery Token Validation Failures — `401 Unauthorized` with missing `X-CSRF` header

**Cause:** The BFF enforces the presence of a custom `X-CSRF: 1` header on all API endpoints decorated with `.AsBffApiEndpoint()`. Requests that do not include this header are rejected.

**Solution:**

Add the `X-CSRF: 1` header to every `fetch()` call targeting a BFF API endpoint. The easiest approach is a centralized wrapper:

```javascript
function bffFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'X-CSRF': '1',
            ...options.headers,
        },
    });
}
```

Also verify that:
- `app.UseBff()` appears **after** `app.UseRouting()` and `app.UseAuthentication()`, and **before** `app.UseAuthorization()` in your middleware pipeline.
- The endpoint is decorated with `.AsBffApiEndpoint()` (Minimal API) or `[BffApi]` / `.AsBffApiEndpoint()` at mapping time (MVC).

See [Middleware Pipeline](/bff/fundamentals/middleware-pipeline/) for the canonical order and a table of common mistakes.

:::caution
If `UseBff()` is placed after `UseAuthorization()`, anti-forgery enforcement is silently disabled with no error. Always verify middleware order.
:::

---

### Symptom: CORS Errors With BFF Endpoints — failed `OPTIONS` preflight on `/bff/user` or API endpoints

**Cause:** The BFF and the SPA are on different origins. CORS errors here are usually a sign that the BFF and frontend are not being served from the same origin, which defeats part of the BFF pattern's security model.

**Solution:**

The BFF is designed to serve the frontend from the same origin. If you must host them on different origins, configure a CORS policy that explicitly allows the SPA origin and allows credentials:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaPolicy", policy =>
    {
        policy.WithOrigins("https://app.example.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookie-based auth
    });
});

// Must come before UseAuthentication and UseBff
app.UseCors("SpaPolicy");
```

:::tip
Whenever possible, serve the SPA's `index.html` from the BFF host itself. This makes the frontend and backend same-origin and eliminates CORS complexity entirely. See [UI Hosting](/bff/architecture/ui-hosting/) for options.
:::

---

### Symptom: Session Expiration Causing Silent Failures — SPA stops receiving data, `401` with no user-facing error

**Cause:** The BFF session (stored in the authentication cookie) has expired. BFF API endpoints return `401` instead of a redirect when the session expires, so the SPA must handle this explicitly.

**Solution:**

Detect `401` responses in your fetch wrapper and redirect to the BFF login endpoint:

```javascript
async function bffFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { 'X-CSRF': '1', ...options.headers },
    });

    if (response.status === 401) {
        window.location.href = `/bff/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        return;
    }

    return response;
}
```

Also consider:
- Polling `/bff/user` periodically to detect session expiry proactively.
- Configuring absolute and sliding session lifetimes on the cookie handler to match your requirements.
- Using [server-side sessions](/bff/fundamentals/session/server-side-sessions/) to enable server-initiated session termination.

---

### Symptom: YARP Proxy Misconfiguration — proxied requests return `404`, missing token, or bypass anti-forgery

**Cause:** Common YARP configuration mistakes include:
- Missing `UseAntiforgeryCheck()` in the `MapReverseProxy` pipeline.
- Typos in metadata keys when using `appsettings.json` configuration.
- Route patterns that don't include `{**catch-all}` to capture sub-paths.

**Solution:**

Ensure `UseAntiforgeryCheck()` is explicitly included:

```csharp
app.MapReverseProxy(proxyApp =>
{
    proxyApp.UseAntiforgeryCheck(); // Required — not automatic for YARP
});
```

When configuring via `appsettings.json`, metadata keys are case-sensitive:

```json
"Metadata": {
    "Duende.Bff.Yarp.TokenType": "User",
    "Duende.Bff.Yarp.AntiforgeryCheck": "true"
}
```

For route patterns, ensure sub-paths are captured:

```json
"Match": { "Path": "/api/{**catch-all}" }
```

:::caution
A typo in a YARP metadata key fails silently — no token is attached and no anti-forgery check is enforced. Always test proxied routes with an authenticated request and verify the `Authorization` header reaches the upstream service.
:::

---

### Symptom: Blazor WASM — Token Not Available in Components, exception or null when calling `GetUserAccessTokenAsync`

**Cause:** In Blazor WASM, `HttpContext` is not available. Access tokens are managed server-side by the BFF host and must never be exposed to client-side components.

**Solution:**

Use `AddLocalApiHttpClient<T>()` to register a typed HTTP client that routes through the BFF host. The BFF host attaches the token server-side before forwarding:

```csharp
// Client-side Program.cs
builder.Services
    .AddBffBlazorClient()
    .AddLocalApiHttpClient<WeatherHttpClient>();
```

The `WeatherHttpClient` then calls the BFF host's local API endpoint (which does have access to `HttpContext` and can call `GetUserAccessTokenAsync()`), rather than calling the remote API directly.

:::caution
Never attempt to retrieve an access token in a Blazor WASM component and pass it to JavaScript or store it in the component state. This defeats the BFF security model.
:::

---

### Symptom: Silent Login Failures — `prompt=none` fails in Safari/Firefox, users unexpectedly logged out

**Cause:** Modern browsers block third-party cookies. The `prompt=none` / silent renew flow in traditional SPAs relies on an iframe that sends a cookie to the identity provider — this breaks when third-party cookies are blocked.

**Solution:**

The BFF pattern is specifically designed to avoid this problem. Token renewal is handled server-side using refresh tokens, which do not rely on third-party cookies. Ensure:

1. `offline_access` scope is requested so a refresh token is issued.
2. `SaveTokens = true` is set on the OIDC handler.
3. The BFF's `Duende.AccessTokenManagement` integration is active (it is by default).

```csharp
options.Scope.Add("offline_access"); // Required for refresh tokens
options.SaveTokens = true;           // Required to store tokens in the session
```

See [Third-Party Cookies](/bff/architecture/third-party-cookies/) for a deeper discussion of how browser cookie restrictions affect authentication flows.

---

### Symptom: 302 Redirect Instead of 401 on API Endpoints — SPA receives HTML instead of JSON

**Cause:** The API endpoint is not marked as a BFF API endpoint, so ASP.NET Core's default challenge behavior (302 redirect) applies instead of BFF's 401 response.

**Solution:**

Add `.AsBffApiEndpoint()` to the endpoint:

```csharp
// Minimal API
app.MapGet("/api/data", () => Results.Ok("data"))
    .RequireAuthorization()
    .AsBffApiEndpoint(); // Converts 302 challenge to 401

// MVC controllers
app.MapControllers()
    .RequireAuthorization()
    .AsBffApiEndpoint();
```

This instructs the BFF middleware to return `401` for unauthenticated requests rather than issuing a redirect challenge. Your SPA can then detect the `401` and navigate to `/bff/login`.

---

### Symptom: Cookie Size Exceeding Browser Limits — users with many roles cannot log in, cookie silently dropped

**Cause:** All claims are stored in the authentication cookie by default. Large numbers of claims (e.g., from many roles or large identity tokens) can cause the cookie to exceed the 4KB browser limit. ASP.NET Core chunks cookies, but excessively large sessions still cause issues.

**Solution:**

Switch to [server-side sessions](/bff/fundamentals/session/server-side-sessions/). The browser cookie then only holds a session ID (a small opaque value), and all claims are stored in the server-side session store:

```csharp
builder.Services.AddBff()
    .AddEntityFrameworkServerSideSessions(options =>
    {
        options.UseSqlServer(connectionString);
    });
```

Additionally, filter unnecessary claims from the session using an `IClaimsTransformation` or by configuring the OIDC handler to not request unnecessary scopes:

```csharp
// Only request claims you actually need
options.Scope.Clear();
options.Scope.Add("openid");
options.Scope.Add("profile");
// Don't add scopes whose claims you don't use
```

:::tip
Server-side sessions are recommended for all production BFF deployments, regardless of claim volume. They also enable server-initiated logout and better session visibility. See [Server-Side Sessions](/bff/fundamentals/session/server-side-sessions/) for setup instructions.
:::

---

## See Also

- [Getting Started: Single Frontend](/bff/getting-started/single-frontend/) — Correct initial setup
- [Getting Started: Blazor](/bff/getting-started/blazor/) — Blazor-specific configuration
- [Local APIs](/bff/fundamentals/apis/local/) — CSRF protection for embedded API endpoints
- [YARP Integration](/bff/fundamentals/apis/yarp/) — Advanced proxy configuration
- [Server-Side Sessions](/bff/fundamentals/session/server-side-sessions/) — Production session persistence
- [Token Management](/bff/fundamentals/tokens/) — Access token refresh and revocation
- [Third-Party Cookies](/bff/architecture/third-party-cookies/) — Browser cookie restrictions and BFF
- [Access Token Management](/accesstokenmanagement/) — The underlying token lifecycle library
