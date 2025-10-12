using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using BFF.Session;

namespace BFF.Endpoints.Auth;

public static class AuthBffEndpoints
{
    public static void MapAuthBffEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/bff/auth");

        // Login: call upstream API login, store upstream auth cookie in BFF session, issue BFF session cookie
        group.MapPost("/login", async (HttpContext httpContext, IHttpClientFactory httpClientFactory, UpstreamSessionStore store, CancellationToken ct) =>
        {
            var client = httpClientFactory.CreateClient("api");

            // Forward body to upstream login (example: API Identity login endpoint)
            using var upstreamRequest = new HttpRequestMessage(HttpMethod.Post, "/api/login")
            {
                Content = new StreamContent(httpContext.Request.Body)
            };
            upstreamRequest.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(httpContext.Request.ContentType ?? "application/json");

            var upstreamResponse = await client.SendAsync(upstreamRequest, ct);
            if (!upstreamResponse.IsSuccessStatusCode)
            {
                return Results.StatusCode((int)upstreamResponse.StatusCode);
            }

            // Capture upstream auth cookie(s)
            var setCookieHeaders = upstreamResponse.Headers.TryGetValues("Set-Cookie", out var values)
                ? values.ToArray() : Array.Empty<string>();

            // Create a BFF session id and map it to upstream cookie header
            var sessionId = Guid.NewGuid().ToString("N");
            var cookieHeaderForUpstream = string.Join("; ", setCookieHeaders
                .Select(v => v.Split(';', 2)[0])); // keep only name=value pairs

            store.SetCookie(sessionId, cookieHeaderForUpstream);

            // Issue BFF session cookie
            httpContext.Response.Cookies.Append(
                UpstreamSessionStore.SessionCookieName,
                sessionId,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Path = "/"
                });

            // Return upstream body (optional)
            var body = await upstreamResponse.Content.ReadAsStringAsync(ct);
            var contentType = upstreamResponse.Content.Headers.ContentType?.ToString() ?? "application/json";
            return Results.Content(body, contentType);
        });

        // Logout: clear BFF session and call upstream logout
        group.MapPost("/logout", async (HttpContext httpContext, IHttpClientFactory httpClientFactory, UpstreamSessionStore store, CancellationToken ct) =>
        {
            var client = httpClientFactory.CreateClient("api");

            if (httpContext.Request.Cookies.TryGetValue(UpstreamSessionStore.SessionCookieName, out var sessionId))
            {
                store.Remove(sessionId);
                httpContext.Response.Cookies.Delete(UpstreamSessionStore.SessionCookieName);
            }

            // Optionally inform upstream
            await client.PostAsync("/api/logout", null, ct);

            return Results.NoContent();
        });

        // Current user info using either BFF session or forwarded Authorization
        group.MapGet("/me", async (HttpContext httpContext, IHttpClientFactory httpClientFactory, CancellationToken ct) =>
        {
            var client = httpClientFactory.CreateClient("api");
            var res = await client.GetAsync("/api/account/user-info", ct);
            var contentType = res.Content.Headers.ContentType?.ToString() ?? "application/json";
            var body = await res.Content.ReadAsStringAsync(ct);
            httpContext.Response.StatusCode = (int)res.StatusCode;
            return Results.Content(body, contentType);
        });
    }
}
