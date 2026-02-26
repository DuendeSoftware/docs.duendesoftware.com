using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Docs.Web.Tests;

public class RedirectMiddlewareTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RedirectMiddlewareTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            // Must disable auto-redirect so we can inspect the 301 response directly
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task KnownRedirectPath_Returns301WithCorrectLocation()
    {
        var response = await _client.GetAsync("/old-path");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal("/new-path/", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task NonRedirectPath_DoesNotReturn301FromRedirectMap()
    {
        // Use a path with a trailing slash to avoid the trailing-slash middleware,
        // isolating the redirect-map middleware behavior.
        var response = await _client.GetAsync("/not-a-redirect/");

        Assert.NotEqual(HttpStatusCode.MovedPermanently, response.StatusCode);
    }

    [Fact]
    public async Task CaseInsensitiveMatching_Returns301()
    {
        var response = await _client.GetAsync("/OLD-PATH");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal("/new-path/", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task TrailingSlash_IsNormalizedBeforeLookup()
    {
        // The redirect middleware strips trailing slashes before lookup,
        // so /old-path/ should match the /old-path entry.
        var response = await _client.GetAsync("/old-path/");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal("/new-path/", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task RedirectPreservesQueryString()
    {
        var response = await _client.GetAsync("/old-path?foo=bar");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal("/new-path/?foo=bar", response.Headers.Location?.OriginalString);
    }
}
