using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;

namespace BFF.Endpoints.Activities;

public static class ActivitiesBffEndpoints
{
    public static void MapActivitiesBffEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/bff/activities");

        // Example aggregation endpoint for activities
        group.MapGet("/summary", async (IHttpClientFactory httpFactory, HttpContext httpContext, CancellationToken ct) =>
        {
            var client = httpFactory.CreateClient("api");

            // Optionally forward Authorization bearer from SPA
            if (httpContext.Request.Headers.TryGetValue("Authorization", out var authHeader) && !string.IsNullOrWhiteSpace(authHeader))
            {
                if (AuthenticationHeaderValue.TryParse(authHeader.ToString(), out var header))
                {
                    client.DefaultRequestHeaders.Authorization = header;
                }
            }

            var recentTask = client.GetAsync("/api/activities?limit=5", ct);
            var moreTask = client.GetAsync("/api/activities?limit=5&pageNumber=2", ct);

            await Task.WhenAll(recentTask, moreTask);

            if (!recentTask.Result.IsSuccessStatusCode || !moreTask.Result.IsSuccessStatusCode)
            {
                return Results.Problem("One or more upstream calls failed", statusCode: 502);
            }

            var recent = await recentTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
            var more = await moreTask.Result.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);

            var payload = new JsonObject
            {
                ["recentActivities"] = recent,
                ["moreActivities"] = more
            };

            return Results.Json(payload);
        });
    }
}
