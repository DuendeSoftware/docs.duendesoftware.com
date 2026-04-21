using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Docs.Web.Tests;

public class ContentNegotiationTests : IClassFixture<MarkdownWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ContentNegotiationTests(MarkdownWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task AcceptMarkdown_WithMatchingMdFile_ReturnsMarkdownContent()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/docs/guide/");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/markdown", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("ai-train=yes, search=yes, ai-input=yes", response.Headers.GetValues("content-signal").Single());
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("# Guide", content);
    }

    [Fact]
    public async Task AcceptMarkdown_WithExactPathMdFile_ReturnsMarkdownContent()
    {
        // /docs/page has no trailing slash — middleware tries /docs/page.md which exists
        var request = new HttpRequestMessage(HttpMethod.Get, "/docs/page");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/markdown", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("ai-train=yes, search=yes, ai-input=yes", response.Headers.GetValues("content-signal").Single());
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("# Page", content);
    }

    [Fact]
    public async Task AcceptMarkdown_NoMdFile_FallsThrough()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/docs/nonexistent/");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        var response = await _client.SendAsync(request);

        Assert.NotEqual("text/markdown", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task AcceptHtml_WithMdFilePresent_DoesNotReturnMarkdown()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/docs/guide/");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));

        var response = await _client.SendAsync(request);

        Assert.NotEqual("text/markdown", response.Content.Headers.ContentType?.MediaType);
    }
}
