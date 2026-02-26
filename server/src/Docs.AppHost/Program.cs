var builder = DistributedApplication.CreateBuilder(args);

// Astro dev server (for local development only)
_ = builder.AddJavaScriptApp("astro", "../../astro")
    .WithHttpEndpoint(port: 4321, env: "PORT")
    .WithExternalHttpEndpoints();

// ASP.NET Core static file server
_ = builder.AddProject<Projects.Docs_Web>("web");

builder.Build().Run();
