---
title: "Secrets"
date: 2020-09-10T08:22:12+02:00
weight: 70
---

#### Duende.IdentityServer.Validation.ISecretParser

Parses a secret from the raw HTTP request.

```cs
public interface ISecretParser
{
    /// <summary>
    /// Tries to find a secret on the context that can be used for authentication
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>A parsed secret</returns>
    Task<ParsedSecret> ParseAsync(HttpContext context);

    /// <summary>
    /// Returns the authentication method name that this parser implements
    /// </summary>
    /// <value>The authentication method.</value>
    string AuthenticationMethod { get; }
}
```

* **`AuthenticationMethod`**

    The name of the authentication method that this parser registers for. This value must be unique and will be displayed in the discovery document.

* **`ParseAsync`**

    The job of this method is to extract the secret from the HTTP request and parse it into a `ParsedSecret`


#### Duende.IdentityServer.Model.ParsedSecret

Represents a parsed secret.

```cs
/// <summary>
/// Represents a secret extracted from the HttpContext
/// </summary>
public class ParsedSecret
{
    /// <summary>
    /// Gets or sets the identifier associated with this secret
    /// </summary>
    /// <value>
    /// The identifier.
    /// </value>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets the credential to verify the secret
    /// </summary>
    /// <value>
    /// The credential.
    /// </value>
    public object Credential { get; set; }

    /// <summary>
    /// Gets or sets the type of the secret
    /// </summary>
    /// <value>
    /// The type.
    /// </value>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets additional properties.
    /// </summary>
    /// <value>
    /// The properties.
    /// </value>
    public Dictionary<string, string> Properties { get; set; } = new Dictionary<string, string>();
}
```

The parsed secret is forwarded to the registered secret validator. The validator will typically inspect the `Type` property to determine if this secret is something that can be validated by that validator instance. If yes, it will know how to cast the `Credential` object into a format that is understood.

#### Duende.IdentityServer.Validation.ISecretParser

Validates a parsed secret.

```cs
public interface ISecretValidator
{
    /// <summary>Validates a secret</summary>
    /// <param name="secrets">The stored secrets.</param>
    /// <param name="parsedSecret">The received secret.</param>
    /// <returns>A validation result</returns>
    Task<SecretValidationResult> ValidateAsync(
      IEnumerable<Secret> secrets,
      ParsedSecret parsedSecret);
}
```