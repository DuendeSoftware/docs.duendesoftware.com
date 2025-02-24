---
title: "BFF User Endpoint Extensibility"
menuTitle: "User"
date: 2022-12-30 10:55:24
weight: 50
---

The BFF user endpoint can be customized by implementing the *IUserService* or by extending *DefaultUserService*, its default implementation. In most cases, extending the default implementation is preferred, as it has several virtual methods that can be overridden to customize particular aspects of how the request is processed. The *DefaultUserService*'s virtual methods are *ProcessRequestAsync*, *GetUserClaims*, and *GetManagementClaims*.

## Request Processing 
*ProcessRequestAsync* is the top level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

For example, you could take whatever actions you need before normal processing of the request like this:

```csharp
public override Task ProcessRequestAsync(HttpContext context)
{
    // Custom logic here

    return base.ProcessRequestAsync(context);
}
```

## User Claims
*GetUserClaims* produces the collection of claims that describe the user. The default implementation returns all the claims in the user's session. Your override could add claims from some other source or manipulate the claims in arbitrary ways.

For example, you could add additional claims to the user endpoint that would not be part of the session like this:

```csharp
protected override IEnumerable<ClaimRecord> GetUserClaims(AuthenticateResult authenticateResult)
{
    var baseClaims = base.GetUserClaims(authenticateResult);
    var sub = authenticateResult.Principal.FindFirstValue("sub");
    var otherClaims = getAdditionalClaims(sub); // Retrieve claims from some data store
    return baseClaims.Append(otherClaims);
}
```

## Management Claims
*GetManagementClaims* is responsible for producing additional claims that are useful for user management. The default implementation creates *bff:session_expires_in*, *bff:session_state*, and *bff:logout_url* [claims]({{< ref "/session/management/user#management-claims" >}}). Your implementation could change those claims or add additional custom claims. 