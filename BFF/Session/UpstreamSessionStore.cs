namespace BFF.Session;

// Simple in-memory store that maps a BFF session id -> upstream cookie header value
public class UpstreamSessionStore
{
    public const string SessionCookieName = "bff_sid";

    private readonly Dictionary<string, string> _cookieStore = new();
    private readonly object _lock = new();

    public void SetCookie(string sessionId, string upstreamCookieHeader)
    {
        lock (_lock)
        {
            _cookieStore[sessionId] = upstreamCookieHeader;
        }
    }

    public bool TryGetCookie(string sessionId, out string cookieHeader)
    {
        lock (_lock)
        {
            return _cookieStore.TryGetValue(sessionId, out cookieHeader!);
        }
    }

    public void Remove(string sessionId)
    {
        lock (_lock)
        {
            _cookieStore.Remove(sessionId);
        }
    }
}
