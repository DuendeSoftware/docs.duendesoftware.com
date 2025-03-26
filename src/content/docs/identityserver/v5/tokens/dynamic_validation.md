---
title: "Dynamic Request Validation and Customization"
date: 2020-09-10T08:22:12+02:00
weight: 50
---

You can hook into the token request pipeline by implementing the [ICustomTokenRequestValidator](/identityserver/v5/reference/validators/custom_token_request_validator) interface.

This allows you to

* add additional token request validation logic
* do custom per-client processing
* add custom response parameters
* return custom errors and error descriptions
* modify parameters on-the-fly
    * access token lifetime and type
    * client claims
    * confirmation method

The following example emits additional claims and changes the token lifetime on-the-fly based on a granted scope.

```cs
public class TransactionScopeTokenRequestValidator : ICustomTokenRequestValidator
{
    public Task ValidateAsync(CustomTokenRequestValidationContext context)
    {
        var transaction = context
                .Result
                .ValidatedRequest
                .ValidatedResources
                .ParsedScopes.FirstOrDefault(x => x.ParsedName == "transaction");

        // transaction scope has been requested
        if (transaction?.ParsedParameter != null)
        {
            // emit transaction id as a claim
            context.Result.ValidatedRequest.ClientClaims.Add(
                new Claim(transaction.ParsedName, transaction.ParsedParameter));

            // also shorten token lifetime
            context.Result.ValidatedRequest.AccessTokenLifetime = 10;
        }

        return Task.CompletedTask;
    }
}
```

You can register your implementation like this:

```cs
builder.AddCustomTokenRequestValidator<TransactionScopeTokenRequestValidator>();
```
