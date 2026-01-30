using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IdentityServer4;
using IdentityServer4.Configuration;
using IdentityServer4.Models;
using IdentityServer4.Stores;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.Infrastructure;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IdentityServerHost
{
    [Authorize]
    public class MigrationAnalysisController : Controller
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<MigrationAnalysisController> _logger;
        private readonly List<Client> _clients;

        public MigrationAnalysisController(
            IServiceProvider services,
            ILogger<MigrationAnalysisController> logger,
            IEnumerable<Client> clients)
        {
            _services = services;
            _logger = logger;
            _clients = clients.ToList();

            // If not in-memory, attempt to resolve clients via known EntityFramework Core store
            if (_clients.Count == 0)
            {
                try
                {
                    var configurationDbContextType = Type.GetType("IdentityServer4.EntityFramework.Interfaces.IConfigurationDbContext, IdentityServer4.EntityFramework.Storage");
                    if (configurationDbContextType != null)
                    {
                        var configurationDbContext = _services.GetRequiredService(configurationDbContextType);
                        var clientsProperty = configurationDbContextType.GetProperty("Clients");
                        var clientsEntities = clientsProperty.GetValue(configurationDbContext);

                        var clientMappersType = Type.GetType("IdentityServer4.EntityFramework.Mappers.ClientMappers, IdentityServer4.EntityFramework.Storage");
                        var toModelMethod = clientMappersType.GetMethod("ToModel");

                        _clients.Clear();
                        foreach (var client in (System.Collections.IEnumerable)clientsEntities)
                        {
                            var clientModel = (Client)toModelMethod.Invoke(null, new[] { client });
                            _clients.Add(clientModel);
                        }
                    }
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Failed to load clients from EntityFramework store");
                }
            }

            // No clients?
            if (_clients.Count == 0)
            {
                _logger.LogWarning("No in-memory or EntityFramework Core-based clients found in your IdentityServer4 setup.");
            }
        }

        public async Task<IActionResult> Index()
        {
            // Verify user is allowed to access this page
            if (User.Identity == null || User.Identity.Name != "scott")
            {
                return Unauthorized();
            }

            var table = new StringBuilder();
            var jsonData = new List<KeyValuePair<string, string>>();
            table.AppendLine("<table class=\"table table-striped table-bordered\">");
            table.AppendLine(HeaderRow("Description", "Raw Data", "Recommendation"));
            table.AppendLine("<tbody>");

            // .NET version
            var dotNetClrVersion = Environment.Version;
            var dotNetClrRecommendation = "";
            if (dotNetClrVersion.Major < 10)
            {
                dotNetClrRecommendation = "Upgrade to latest .NET LTS version.";
            }
            table.AppendLine(DataRow(".NET version", dotNetClrVersion.ToString(), dotNetClrRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("dotNetClrVersion", dotNetClrVersion.ToString()));

            // IdentityServer4 version
            var identityServerVersion = typeof(IdentityServerConstants).Assembly.GetName().Version;
            string identityServerRecommendation;
            if (identityServerVersion.Major < 4)
            {
                identityServerRecommendation = "Upgrade to IdentityServer4 4.x will be needed prior to being able to upgrade to Duende IdentityServer, as outlined at <a href=\"https://docs.duendesoftware.com/identityserver/upgrades/identityserver4-to-duende-identityserver-v7/#identityserver4-v3x-to-identityserver-v4x\" target=\"_blank\">IdentityServer4 v3.x to v4.x</a>.";
            }
            else
            {
                identityServerRecommendation = "Migration to Duende.IdentityServer can be done as described here <a href=\"https://docs.duendesoftware.com/identityserver/upgrades/identityserver4-to-duende-identityserver-v7/#identityserver4-v4x-to-duende-identityserver\" target=\"_blank\">IdentityServer4 v4.x to Duende IdentityServer</a>.";
            }
            table.AppendLine(DataRow("IdentityServer4 version", identityServerVersion.ToString(), identityServerRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("identityServerVersion", identityServerVersion.ToString()));

            // Clients
            var interactiveClientsCount = _clients.Count(c => c.AllowedGrantTypes.Contains(GrantType.AuthorizationCode));
            var otherClientsCount = _clients.Count() - interactiveClientsCount;
            var clientData = string.Format("Interactive: {0}, Non-interactive: {1}", interactiveClientsCount,
                otherClientsCount);
            var clientDataRecommendation = "Determine the correct production environment licensing needs. See <a href=\"https://duendesoftware.com/products/identityserver\" target=\"_blank\">Duende IdentityServer Pricing</a>.";
            table.AppendLine(DataRow("Number of interactive and non-interactive clients", clientData, clientDataRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("clientCount", _clients.Count.ToString()));
            jsonData.Add(new KeyValuePair<string, string>("clientData", clientData));

            // Issuer URI
            var identityServerOptions = _services.GetRequiredService<IOptions<IdentityServerOptions>>();
            var issuerUri = !string.IsNullOrEmpty(identityServerOptions.Value.IssuerUri)
                ? identityServerOptions.Value.IssuerUri
                : "(inferred from request)";
            table.AppendLine(DataRow("Issuer URI", issuerUri, ""));
            jsonData.Add(new KeyValuePair<string, string>("issuerUri", issuerUri));

            // Signing credential store type
            var signingCredentialStore = _services.GetService<ISigningCredentialStore>();
            var signingCredentialStoreType = signingCredentialStore?.GetType().FullName ?? "(not set)";
            var signingCredentialStoreRecommendation = "";
            if (signingCredentialStoreType != "(not set)" && !signingCredentialStoreType.StartsWith("IdentityServer4"))
            {
                signingCredentialStoreRecommendation = "Investigate compatibility.";
            }
            table.AppendLine(DataRow("Signing credential store type", signingCredentialStoreType, signingCredentialStoreRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("signingCredentialStoreType", signingCredentialStoreType));

            // Signing credential key id
            var signingCredentialKeyId = "(not set)";
            if (signingCredentialStore != null)
            {
                var signingCredentials = await signingCredentialStore.GetSigningCredentialsAsync();
                if (signingCredentials != null)
                {
                    signingCredentialKeyId = signingCredentials.Kid;
                }
            }
            var signingCredentialKeyRecommendation = "<a href=\"https://docs.duendesoftware.com/identityserver/upgrades/identityserver4-to-duende-identityserver-v7/#step-6-migrate-signing-keys\" target=\"_blank\">Migrate Signing Keys (optional)</a>";
            table.AppendLine(DataRow("Signing credential key id", signingCredentialKeyId, signingCredentialKeyRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("signingCredentialKeyId", signingCredentialKeyId));

            // Data protection application name
            var dataProtectionApplicationDiscriminator = "(not set)";
            var dataProtectionApplicationDiscriminatorService = _services.GetService<IApplicationDiscriminator>();
            if (dataProtectionApplicationDiscriminatorService != null)
            {
                dataProtectionApplicationDiscriminator = dataProtectionApplicationDiscriminatorService.Discriminator;
            }
            var dataProtectionOptions = _services.GetService<IOptions<DataProtectionOptions>>();
            if (dataProtectionOptions != null && dataProtectionOptions.Value.ApplicationDiscriminator != null)
            {
                dataProtectionApplicationDiscriminator = dataProtectionOptions.Value.ApplicationDiscriminator;
            }
            var dataProtectionApplicationDiscriminatorRecommendation = "";
            if (dataProtectionApplicationDiscriminator == "(not set)" || string.IsNullOrEmpty(dataProtectionApplicationDiscriminator) || dataProtectionApplicationDiscriminator.Contains("/") || dataProtectionApplicationDiscriminator.Contains("\\"))
            {
                dataProtectionApplicationDiscriminatorRecommendation = "<a href=\"https://docs.duendesoftware.com/identityserver/upgrades/identityserver4-to-duende-identityserver-v7/#step-7-verify-data-protection-configuration\" target=\"_blank\">Verify Data Protection Configuration</a>";
            }
            table.AppendLine(DataRow("Data protection application name", dataProtectionApplicationDiscriminator, dataProtectionApplicationDiscriminatorRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("dataProtectionApplicationDiscriminator", dataProtectionApplicationDiscriminator));

            // Data protection repository type
            var dataProtectionRepositoryType = "(not set)";
            var dataProtectionKeyManagementOptions = _services.GetService<IOptions<KeyManagementOptions>>();
            if (dataProtectionKeyManagementOptions != null && dataProtectionKeyManagementOptions.Value.XmlRepository != null)
            {
                dataProtectionRepositoryType = dataProtectionKeyManagementOptions.Value.XmlRepository.GetType().FullName;
            }
            var dataProtectionRepositoryTypeRecommendation = "";
            if (dataProtectionRepositoryType == "(not set)")
            {
                dataProtectionRepositoryTypeRecommendation = "Consider a persistent store as per <a href=\"https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview\" target=\"_blank\">Microsoft documentation</a>.";
            }
            table.AppendLine(DataRow("Data protection repository type", dataProtectionRepositoryType, dataProtectionRepositoryTypeRecommendation));
            jsonData.Add(new KeyValuePair<string, string>("dataProtectionRepositoryType", dataProtectionRepositoryType));

            // Authentication schemes
            var authenticationSchemeProvider = _services.GetService<IAuthenticationSchemeProvider>();
            if (authenticationSchemeProvider != null)
            {
                var authenticationSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();
                foreach (var scheme in authenticationSchemes)
                {
                    var schemeRecommendation = "";
                    if (!scheme.HandlerType.FullName.StartsWith("IdentityServer4") && !scheme.HandlerType.FullName.StartsWith("Microsoft"))
                    {
                        schemeRecommendation = "Research compatibility with ASP.NET Core and Duende IdentityServer.";
                    }
                    table.AppendLine(DataRow(string.Format("Authentication scheme: {0} {1}", scheme.Name, scheme.DisplayName), scheme.HandlerType.FullName, schemeRecommendation));
                    jsonData.Add(new KeyValuePair<string, string>(string.Format("authenticationScheme:{0}", scheme.Name), scheme.HandlerType.FullName));
                }
            }

            table.AppendLine("</tbody>");
            table.AppendLine("</table>");

            // Build JSON
            var json = new StringBuilder();
            json.AppendLine("{");
            for (var i = 0; i < jsonData.Count; i++)
            {
                json.Append(JsonData(jsonData[i].Key, jsonData[i].Value));
                json.AppendLine(i < jsonData.Count - 1 ? "," : "");
            }
            json.AppendLine("}");

            // language=html
            var html = string.Format(@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Duende Software - IdentityServer4 Migration Analysis</title>
    <link rel=""stylesheet"" href=""https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"" integrity=""sha256-fx038NkLY4U1TCrBDiu5FWPEa9eiZu01EiLryshJbCo="" crossorigin=""anonymous"">
    <style>
        :root {{
            --bs-blue: #43257c;
            --bs-primary: #43257c;
        }}
        body {{
            font-family: system-ui, -apple-system, ""Segoe UI"", Roboto, ""Helvetica Neue"", ""Noto Sans"", ""Liberation Sans"", Arial, sans-serif;
            padding-bottom: 50px;
        }}
        .navbar {{
            background-color: var(--bs-primary);
        }}
        h1 {{ margin-top: 30px; margin-bottom: 20px; }}
        .table td {{ vertical-align: middle; }}

        /* Hubspot form styles */
        .hs-form.stacked {{
            display: flex;
            flex-wrap: wrap;
            margin-right: calc(-.5 * var(--bs-gutter-x));
            margin-left: calc(-.5 * var(--bs-gutter-x));
        }}

        .hs-form.stacked .form-columns-1,
        .hs-form.stacked .form-columns-2,
        .hs-form.stacked .hs-submit {{
            max-width: 100%;
            padding-right: calc(var(--bs-gutter-x) * .5);
            padding-left: calc(var(--bs-gutter-x) * .5);
        }}

        .hs-form.stacked .form-columns-1 {{
            flex: 0 0 auto;
            width: 100%;
        }}

        .hs-form.stacked .form-columns-2 {{
            flex: 0 0 auto;
            width: 100%;
        }}

        @media screen and (min-width: 768px) {{

            .hs-form.stacked .form-columns-2 {{
                width: 50%;
            }}
        }}

        .hs-form.stacked .form-columns-1 .hs-form-field,
        .hs-form.stacked .form-columns-2 .hs-form-field {{
            float: none;
            width: 100%;
            margin-bottom: 1rem;
        }}

        @media screen and (max-width: 400px),
        (min-device-width: 320px) and (max-device-width: 480px) {{
            .hs-form.stacked .form-columns-2 .hs-form-field .hs-input {{
                width: 100% !important;
            }}
        }}

        .hs-form.stacked .form-columns-1 .hs-input[type=""text""],
        .hs-form.stacked .form-columns-1 .hs-input[type=""tel""],
        .hs-form.stacked .form-columns-1 .hs-input[type=""email""],
        .hs-form.stacked .form-columns-1 textarea.hs-input,
        .hs-form.stacked .form-columns-2 .hs-input[type=""text""],
        .hs-form.stacked .form-columns-2 .hs-input[type=""tel""],
        .hs-form.stacked .form-columns-2 .hs-input[type=""email""],
        .hs-form.stacked .form-columns-2 textarea.hs-input {{
            display: block;
            width: 100%;
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.5;
            color: var(--bs-body-color);
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-color: var(--bs-body-bg);
            background-clip: padding-box;
            border: var(--bs-border-width) solid var(--bs-border-color);
            border-radius: var(--bs-border-radius);
            transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
        }}

        .hs-form.stacked .form-columns-1 .input,
        .hs-form.stacked .form-columns-2 .input {{
            margin-right: 0;
        }}

        .hs-form .hs-form-required {{
            color: red;
            font-size: 0.825rem;
            position: relative;
            top: -0.25rem;
            left: 0.25rem;
        }}

        .hs-form .inputs-list {{
            list-style: none;
            margin: 0;
            padding: 0;
        }}

        .hs-form .hs-error-msgs .hs-error-msg {{
            color: red;
            font-size: 0.825rem;
        }}

        .hs-form.stacked .form-columns-1 .hs-input[type=""checkbox""],
        .hs-form.stacked .form-columns-2 .hs-input[type=""checkbox""] {{
            --bs-form-check-bg: var(--bs-body-bg);
            flex-shrink: 0;
            width: 1em;
            height: 1em;
            margin-top: 0.25em;
            vertical-align: top;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-color: var(--bs-form-check-bg);
            background-image: var(--bs-form-check-bg-image);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            border: var(--bs-border-width) solid var(--bs-border-color);
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
            border-radius: 0.25em;
        }}

        .hs-form.stacked .form-columns-1 .hs-input:checked[type=checkbox],
        .hs-form.stacked .form-columns-2 .hs-input:checked[type=checkbox] {{
            background-color: #0d6efd;
            border-color: #0d6efd;
            background-image: url('data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22%3e%3cpath fill=%22none%22 stroke=%22%23fff%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%223%22 d=%22m6 10 3 3 6-6%22/%3e%3c/svg%3e');
            background-position: 50%;
            background-repeat: no-repeat;
            background-size: contain;
        }}

        .hs-form .legal-consent-container .hs-richtext {{
            margin-bottom: 1rem;
        }}

        .hs-form.stacked .hs-submit {{
            width: 100%;
            text-align: center;
        }}

        .hs-form .hs-submit .hs-button {{
            --bs-btn-padding-x: 0.75rem;
            --bs-btn-padding-y: 0.375rem;
            --bs-btn-font-family: ;
            --bs-btn-font-size: 1rem;
            --bs-btn-font-weight: 400;
            --bs-btn-line-height: 1.5;
            --bs-btn-color: var(--bs-body-color);
            --bs-btn-bg: transparent;
            --bs-btn-border-width: var(--bs-border-width);
            --bs-btn-border-color: transparent;
            --bs-btn-border-radius: var(--bs-border-radius);
            --bs-btn-hover-border-color: transparent;
            --bs-btn-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 1px rgba(0, 0, 0, 0.075);
            --bs-btn-disabled-opacity: 0.65;
            --bs-btn-focus-box-shadow: 0 0 0 0.25rem rgba(var(--bs-btn-focus-shadow-rgb), .5);
            display: inline-block;
            padding: var(--bs-btn-padding-y) var(--bs-btn-padding-x);
            font-family: var(--bs-btn-font-family);
            font-size: var(--bs-btn-font-size);
            font-weight: var(--bs-btn-font-weight);
            line-height: var(--bs-btn-line-height);
            color: var(--bs-btn-color);
            text-align: center;
            text-decoration: none;
            vertical-align: middle;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            border: var(--bs-btn-border-width) solid var(--bs-btn-border-color);
            border-radius: var(--bs-btn-border-radius);
            background-color: var(--bs-btn-bg);
            transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
        }}

        .hs-form .hs-submit .primary {{
            color: var(--white);
            background-color: var(--bright-turquoise);
            border-color: var(--bright-turquoise);
        }}

        .hs-form .hs-submit .primary:hover,
        .hs-form .hs-submit .primary:focus,
        .hs-form .hs-submit .primary:active {{
            color: var(--white);
            background-color: var(--bright-turquoise);
            border-color: var(--bright-turquoise);
        }}
    </style>
</head>
<body>
    <nav class=""navbar navbar-dark mb-4"">
        <div class=""container"">
            <span class=""navbar-brand mb-0 h1"">IdentityServer4 - Migration Analysis</span>
        </div>
    </nav>
    <div class=""container"">
        <div class=""alert alert-info"">
            This report analyzes your current IdentityServer4 deployment and provides recommendations for migrating to <a href=""https://duendesoftware.om/products/identityserver/"">Duende IdentityServer</a>.<br />
            Note that the data provided is informative and should not be considered a complete migration plan.
        </div>
        {0}

        <h1>Book a free IdentityServer4 Analysis call</h1>
        <script charset=""utf-8"" type=""text/javascript"" src=""https://js.hsforms.net/forms/embed/v2.js""></script>
        <script>
          hbspt.forms.create({{
            portalId: ""47428297"",
            formId: ""41a32e6c-825f-4a8f-956f-ab816b2aa137"",
            region: ""na1"",
            onFormReady: function(form) {{
                var json = {1};
                try {{
                    form.elements.namedItem(""0-2/of_client_applications"").value = json.clientCount;
                    form.elements.namedItem(""diagnostics_json"").value = JSON.stringify(json);
                }} catch {{ }}
            }}
          }});
        </script>
    </div>
</body>
</html>", table.ToString(), json.ToString());
            return Content(html, "text/html");
        }

        private string HeaderRow(string col1, string col2, string col3)
        {
            return string.Format("<thead class=\"table-dark\"><tr><th>{0}</th><th>{1}</th><th>{2}</th></tr></thead>", col1, col2, col3);
        }

        private string DataRow(string col1, string col2, string col3)
        {
            return string.Format("<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>", col1, col2, col3);
        }

        private string JsonData(string property, string value)
        {
            return string.Format("\"{0}\": \"{1}\"", property, value.Replace("\"", "'"));
        }
    }
}