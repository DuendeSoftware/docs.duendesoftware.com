---
title: SMTP OTP Sender Reference
description: Reference for the SmtpOtpSender, including configuration options, template placeholders, and security best practices for email-based one-time password delivery.
date: 2026-04-29
sidebar:
  label: SMTP OTP Sender
  order: 2
---

The `SmtpOtpSender` delivers one-time passwords (OTPs) via email using SMTP. It includes a built-in default template with security warnings and supports fully customizable plain text, HTML, and subject templates.

## Registration

Register the SMTP One-Time Password (OTP) sender using `UseSmtpOtpSender` on the authentication builder:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth => auth.UseSmtpOtpSender(options =>
    {
        options.Host = "smtp.example.com";
        options.Port = 587;
        options.EnableSsl = true;
        options.FromEmail = "noreply@example.com";
        options.FromName = "MyApp";
    }))
);
```

## `SmtpOtpSenderOptions`

All properties on `SmtpOtpSenderOptions` are configured via the `Action<SmtpOtpSenderOptions>` delegate passed to `UseSmtpOtpSender`.

| Property            | Type      | Required | Default | Description                                                                                                                                                                                                                                                    |
|---------------------|-----------|----------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Host`              | `string`  | Yes      | N/A     | SMTP server hostname or IP address.                                                                                                                                                                                                                            |
| `Port`              | `int`     | No       | `1025`  | SMTP server port. Typically `587` for STARTTLS or `465` for implicit TLS.                                                                                                                                                                                      |
| `EnableSsl`         | `bool`    | No       | `true`  | Whether to use SSL/TLS for the SMTP connection. Always set to `true` in production.                                                                                                                                                                            |
| `FromEmail`         | `string`  | Yes      | N/A     | The sender email address used in the `From` header.                                                                                                                                                                                                            |
| `FromName`          | `string`  | Yes      | N/A     | The sender display name used in the `From` header and in email templates.                                                                                                                                                                                      |
| `Domain`            | `string?` | No       | `null`  | The domain or URL where the user should enter the code (e.g. `"https://app.example.com"`). When set, the default template includes a domain-specific security warning. When `null`, templates receive `"our official website"` for the `{Domain}` placeholder. |
| `PlainTextTemplate` | `string?` | No       | `null`  | Custom plain text body template. Supports [template placeholders](#template-placeholders). When `null`, the built-in default template is used.                                                                                                                 |
| `HtmlTemplate`      | `string?` | No       | `null`  | Custom HTML body template. Supports [template placeholders](#template-placeholders). When set, the email is sent as HTML. Takes precedence over `PlainTextTemplate`.                                                                                           |
| `SubjectTemplate`   | `string?` | No       | `null`  | Custom subject line template. Supports `{FromName}` and `{Code}` placeholders. When `null`, defaults to `"{FromName} confirmation code"`.                                                                                                                      |

## Default Email Format

When no custom templates are configured, the sender uses a built-in plain text template with security warnings.

**Subject:**

```text
MyApp confirmation code
```

**Body:**

```text
123-456 is your MyApp confirmation code (expires after 5 minute(s))

IMPORTANT SECURITY INFORMATION:
- You should only use this code if you requested it
- If you did not request this code, please ignore this email
- Only enter this code on https://app.example.com
- Do not share this code with anyone
- MyApp will never ask you for this code
```

The domain line is only included when `Domain` is set. Without it, the line reads `Only enter this code on our official website`.

## Template Placeholders

All three template properties (`PlainTextTemplate`, `HtmlTemplate`, `SubjectTemplate`) support the following placeholders:

| Placeholder        | Description                                                                                      | Example Value     |
|--------------------|--------------------------------------------------------------------------------------------------|-------------------|
| `{Code}`           | The OTP code, formatted with hyphens between groups.                                             | `123-456`         |
| `{FromName}`       | The configured sender name (`SmtpOtpSenderOptions.FromName`).                                    | `MyApp`           |
| `{ExpiresMinutes}` | The number of minutes until the code expires, as a whole number.                                 | `5`               |
| `{Domain}`         | The configured domain (`SmtpOtpSenderOptions.Domain`), or `"our official website"` when not set. | `app.example.com` |

Note: `SubjectTemplate` only supports `{FromName}` and `{Code}`.

## Custom Templates

### Plain Text Template

```csharp
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth => auth.UseSmtpOtpSender(options =>
    {
        options.Host = "smtp.example.com";
        options.Port = 587;
        options.EnableSsl = true;
        options.FromEmail = "noreply@example.com";
        options.FromName = "MyApp";
        options.Domain = "app.example.com";

        options.PlainTextTemplate = @"
Hello,

Your verification code is: {Code}

This code will expire in {ExpiresMinutes} minutes.

SECURITY NOTICE:
- If you did not request this code, please ignore this email
- Only enter this code on {Domain}
- Never share this code with anyone, including {FromName} staff
- We will never ask you to provide this code over phone or email

Thank you,
The {FromName} Team
";
    }))
);
```

### HTML Template

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth => auth.UseSmtpOtpSender(options =>
    {
        options.Host = "smtp.example.com";
        options.Port = 587;
        options.EnableSsl = true;
        options.FromEmail = "noreply@example.com";
        options.FromName = "MyApp";
        options.Domain = "app.example.com";

        options.HtmlTemplate = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code-box { background: #f4f4f4; padding: 20px; text-align: center;
                    font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>{FromName}</h1>
        <div class='code-box'>{Code}</div>
        <p>This code expires in <strong>{ExpiresMinutes} minutes</strong>.</p>
        <div class='warning'>
            <strong>Security:</strong> Only enter this code on <strong>{Domain}</strong>.
            Never share it with anyone.
        </div>
    </div>
</body>
</html>
";
    }))
);
```

### Custom Subject

```csharp
options.SubjectTemplate = "[{FromName}] Your verification code: {Code}";
```

## Binding From Configuration

SMTP connection settings can be bound from `appsettings.json`:

```json title="appsettings.json"
{
  "Smtp": {
    "Host": "smtp.sendgrid.net",
    "Port": 587,
    "FromEmail": "noreply@mycompany.com"
  }
}
```

Your startup code can then bind to this section:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth => auth.UseSmtpOtpSender(options =>
    {
        builder.Configuration.GetSection("Smtp").Bind(options);
        options.EnableSsl = true;
        options.FromName = "MyCompany";
        options.Domain = "https://app.mycompany.com";
    }))
);
```

## Security Best Practices

* **Always include security warnings**: Whether using the default or a custom template, tell users to only enter the code if they requested it, where to enter it, and never to share it.
* **Set the `Domain` property**: Telling users the exact URL where the code should be entered reduces phishing risk.
* **Enable SSL/TLS**: Always set `EnableSsl = true` and use port `587` (STARTTLS) or `465` (implicit TLS) in production.
* **Use clear expiration times**: Include `{ExpiresMinutes}` in your template so users know how long the code is valid.
* **Brand your emails consistently**: Use your organization name via `FromName` throughout the template to build user trust.
