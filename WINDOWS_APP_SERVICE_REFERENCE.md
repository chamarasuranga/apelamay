# Windows App Service Quick Reference

## Key Configuration Differences

### App Service Plan
```json
{
  "type": "Microsoft.Web/serverfarms",
  "kind": "windows",
  "properties": {
    "reserved": false  // false = Windows, true = Linux
  }
}
```

### App Services (API & BFF)
```json
{
  "type": "Microsoft.Web/sites",
  "kind": "app",  // NOT "app,linux"
  "properties": {
    "siteConfig": {
      "netFrameworkVersion": "v9.0",  // NOT linuxFxVersion
      "alwaysOn": true
    }
  }
}
```

## CLI Commands

### Create Windows App Service Plan
```bash
az appservice plan create \
  --name myplan \
  --resource-group myrg \
  --sku B1
  # NO --is-linux flag
```

### Create Windows Web App
```bash
az webapp create \
  --name myapp \
  --resource-group myrg \
  --plan myplan \
  --runtime "DOTNET:9"  # Format: DOTNET:X (not DOTNET|X.0)
```

## Azure DevOps Pipeline

```yaml
- task: AzureWebApp@1
  inputs:
    appType: 'webApp'  # NOT 'webAppLinux'
    appName: '$(appName)'
    package: '$(package)'
```

## Available .NET Runtimes for Windows

- `DOTNET:6`
- `DOTNET:7`
- `DOTNET:8`
- `DOTNET:9`

List all available:
```bash
az webapp list-runtimes --os windows
```

## Verification Commands

```bash
# Check runtime version
az webapp config show \
  --name myapp \
  --resource-group myrg \
  --query "netFrameworkVersion"

# Check OS type
az appservice plan show \
  --name myplan \
  --resource-group myrg \
  --query "[kind, reserved]"
# Output: ["app", false] = Windows
```

## Common Issues

### Issue: Deployment fails with "Invalid runtime"
**Solution:** Use `DOTNET:9` not `DOTNET|9.0`

### Issue: App won't start
**Solution:** Check Application Settings in Azure Portal:
- Ensure `ASPNETCORE_ENVIRONMENT` is set
- Verify connection strings are correct

### Issue: Build artifacts not found
**Solution:** Ensure publish output uses correct path:
```bash
dotnet publish -c Release -o ./publish
```

## Migration from Linux to Windows

If migrating existing Linux apps:

1. **Update App Service Plan:**
   - Create new Windows plan (can't convert existing Linux plan)
   
2. **Update App Services:**
   - Recreate apps on Windows plan
   - Update configuration settings
   
3. **Update Deployment Scripts:**
   - Remove `--is-linux` flags
   - Change runtime format to `DOTNET:X`
   
4. **Update CI/CD Pipelines:**
   - Change `appType` to `'webApp'`

## Performance Notes

- Windows App Services have similar performance to Linux
- Cold start times are comparable
- Cost is the same for equivalent SKUs
- Consider S1 or higher for production (AlwaysOn)

## Best Practices

1. **Always use HTTPS:** Set `httpsOnly: true`
2. **Enable AlwaysOn:** For production workloads (B1+)
3. **Use App Insights:** Monitor performance and errors
4. **Set Min TLS:** Use `minTlsVersion: "1.2"`
5. **Disable FTP:** Set `ftpsState: "Disabled"`

## Resource Links

- [Azure App Service Plans](https://learn.microsoft.com/azure/app-service/overview-hosting-plans)
- [.NET on App Service](https://learn.microsoft.com/azure/app-service/configure-language-dotnet-framework)
- [App Service ARM Reference](https://learn.microsoft.com/azure/templates/microsoft.web/sites)
