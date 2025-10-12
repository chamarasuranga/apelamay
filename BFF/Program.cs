using Microsoft.AspNetCore.HttpOverrides;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Transforms;
using BFF.Endpoints;
using BFF.Endpoints.Activities;
using BFF.Endpoints.Auth;
using BFF.Session;

var builder = WebApplication.CreateBuilder(args);

// Get API URL from configuration (supports different environments)
var apiUrl = builder.Configuration["ApiUrl"] ?? "https://localhost:5001";
var viteDevServerUrl = "https://localhost:3000";

// Build route and cluster configs based on environment
var routes = new List<RouteConfig>
{
    new RouteConfig
    {
        RouteId = "api-route",
        ClusterId = "api-cluster",
        Match = new RouteMatch { Path = "/api/{**catch-all}" }
    },
    new RouteConfig
    {
        RouteId = "signalr-route",
        ClusterId = "api-cluster",
        Match = new RouteMatch { Path = "/comments/{**catch-all}" }
    }
};

var clusters = new List<ClusterConfig>
{
    new ClusterConfig
    {
        ClusterId = "api-cluster",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["api"] = new DestinationConfig
            {
                Address = apiUrl
            }
        }
    }
};

// In development, proxy SPA requests to Vite dev server
if (builder.Environment.IsDevelopment())
{
    routes.Add(new RouteConfig
    {
        RouteId = "spa-route",
        ClusterId = "spa-cluster",
        Match = new RouteMatch { Path = "/{**catch-all}" },
        Order = 2 // Lower priority than API routes
    });

    clusters.Add(new ClusterConfig
    {
        ClusterId = "spa-cluster",
        Destinations = new Dictionary<string, DestinationConfig>
        {
            ["vite"] = new DestinationConfig
            {
                Address = viteDevServerUrl
            }
        }
    });
}

// Reverse proxy to API and SPA
builder.Services.AddReverseProxy()
    .LoadFromMemory(routes, clusters)
    // Inject upstream cookie from BFF session on proxied requests
    .AddTransforms(builderContext =>
    {
        builderContext.AddRequestTransform(ctx =>
        {
            // Correlation id
            if (!ctx.ProxyRequest.Headers.Contains("X-Correlation-ID"))
            {
                ctx.ProxyRequest.Headers.Add("X-Correlation-ID", ctx.HttpContext.TraceIdentifier);
            }

            // Bridge BFF session to upstream cookie
            var store = ctx.HttpContext.RequestServices.GetRequiredService<UpstreamSessionStore>();
            if (ctx.HttpContext.Request.Cookies.TryGetValue(UpstreamSessionStore.SessionCookieName, out var sid)
                && store.TryGetCookie(sid, out var cookiePair))
            {
                // Overwrite Cookie header for upstream auth cookie
                ctx.ProxyRequest.Headers.Remove("Cookie");
                ctx.ProxyRequest.Headers.Add("Cookie", cookiePair);
            }

            return ValueTask.CompletedTask;
        });
    });

// HttpClient for BFF -> API calls
builder.Services.AddHttpClient("api", client =>
{
    client.BaseAddress = new Uri(apiUrl);
});

// Session store for upstream auth cookie
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<UpstreamSessionStore>();

builder.Services.AddCors();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseWebSockets();

// In production, serve SPA static files from wwwroot
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Map domain-specific BFF endpoints
app.MapActivitiesBffEndpoints();
app.MapAuthBffEndpoints();

// Proxy to upstream API and (in dev) to Vite dev server
app.MapReverseProxy();

// Fallback to SPA (production only)
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();
