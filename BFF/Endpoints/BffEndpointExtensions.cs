using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;

namespace BFF.Endpoints;

public static class BffEndpointExtensions
{
    public static void MapBffEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/bff");

        // Aggregation endpoint: one BFF call -> multiple API calls
        group.MapGet("/summary", async (IHttpClientFactory httpFactory, HttpContext httpContext, CancellationToken ct) =>
        {
            var client = httpFactory.CreateClient("api");

            // Optionally forward Authorization from browser to API (or attach server-side token)
            if (httpContext.Request.Headers.TryGetValue("Authorization", out var authHeader) && !string.IsNullOrWhiteSpace(authHeader))
            {
                if (AuthenticationHeaderValue.TryParse(authHeader.ToString(), out var header))
                {
                    client.DefaultRequestHeaders.Authorization = header;
                }
            }

            // Parallel upstream calls
            var recentTask = client.GetAsync("/api/activities?limit=5", ct);
            var moreTask = client.GetAsync("/api/activities?limit=5&pageNumber=2", ct);

            await Task.WhenAll(recentTask, moreTask);

            if (!recentTask.Result.IsSuccessStatusCode || !moreTask.Result.IsSuccessStatusCode)
            {
                return Results.Problem("One or more upstream calls failed", statusCode: 502);
            }

            var recentJson = await recentTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
            var moreJson = await moreTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);

            var payload = new JsonObject
            {
                ["recentActivities"] = recentJson,
                ["moreActivities"] = moreJson
            };

            return Results.Json(payload);
        });

        // Compose endpoint: read body, fan-out, enrich
        group.MapPost("/compose", async (IHttpClientFactory httpFactory, HttpContext httpContext, CancellationToken ct) =>
        {
            var client = httpFactory.CreateClient("api");
            var input = await httpContext.Request.ReadFromJsonAsync<JsonObject>(cancellationToken: ct) ?? new JsonObject();
            var search = (string?)input["search"] ?? string.Empty;

            var listTask = client.GetAsync($"/api/activities?query={Uri.EscapeDataString(search)}&limit=10", ct);
            var statsTask = client.GetAsync("/api/activities?limit=1", ct);

            await Task.WhenAll(listTask, statsTask);

            if (!listTask.Result.IsSuccessStatusCode || !statsTask.Result.IsSuccessStatusCode)
                return Results.Problem("Upstream error", statusCode: 502);

            var listJson = await listTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
            var statsJson = await statsTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);

            var composed = new JsonObject
            {
                ["query"] = search,
                ["items"] = listJson,
                ["stats"] = statsJson,
                ["note"] = "Composed by BFF",
                ["serverTime"] = DateTimeOffset.UtcNow.ToString("O")
            };

            return Results.Json(composed);
        });

        // Custom handler that overrides a specific API path (short-circuits proxy)
        app.MapGet("/api/special", async (IHttpClientFactory httpFactory, CancellationToken ct) =>
        {
            var client = httpFactory.CreateClient("api");
            var upstream = await client.GetAsync("/api/activities?limit=1", ct);
            if (!upstream.IsSuccessStatusCode) return Results.Problem("Upstream error", statusCode: 502);

            var item = await upstream.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
            var response = new JsonObject
            {
                ["message"] = "Handled by BFF (not proxied)",
                ["item"] = item,
                ["serverTime"] = DateTimeOffset.UtcNow.ToString("O")
            };

            return Results.Json(response);
        });
    }
}
