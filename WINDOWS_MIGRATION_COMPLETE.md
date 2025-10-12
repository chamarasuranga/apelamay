# ✅ Windows App Service Migration Complete

## Summary
Successfully migrated Reactivities application Azure deployment configuration from **Linux** to **Windows App Services**.

---

## Files Modified

### ✅ ARM Template (`azure-deploy.json`)
**Changes:**
- App Service Plan: `kind: "windows"`, `reserved: false`
- API App: `kind: "app"` (removed `"linux"`), added `netFrameworkVersion: "v9.0"`
- BFF App: `kind: "app"` (removed `"linux"`), added `netFrameworkVersion: "v9.0"`
- Removed all `linuxFxVersion` references

### ✅ Azure Pipelines
**Files Updated:**
- `azure-pipelines.yml` → `appType: 'webApp'`
- `azure-pipelines-api.yml` → `appType: 'webApp'`
- `azure-pipelines-bff.yml` → `appType: 'webApp'`

### ✅ Setup Script (`setup-azure-devops.ps1`)
**Changes:**
- Removed `--is-linux` flag from App Service Plan creation
- Changed runtime: `"DOTNET|9.0"` → `"DOTNET:9"`

### ✅ Documentation
**Files Updated:**
- `AZURE_DEPLOYMENT.md`
- `AZURE_DEVOPS_DEPLOYMENT.md`
- `ARM_TEMPLATE_GUIDE.md`
- `ARM_QUICK_REFERENCE.md`
- `DOTNET_9_UPDATE_SUMMARY.md`

**New Files Created:**
- `WINDOWS_MIGRATION_SUMMARY.md`
- `WINDOWS_APP_SERVICE_REFERENCE.md`
- `DEPLOYMENT_COMPLETE.md`

---

## Key Configuration Differences

### Windows vs Linux

| Aspect | Linux (Old) | Windows (New) |
|--------|-------------|---------------|
| **App Service Kind** | `"app,linux"` | `"app"` |
| **Runtime Config Property** | `linuxFxVersion` | `netFrameworkVersion` |
| **Runtime Value** | `"DOTNET\|9.0"` | `"v9.0"` |
| **Plan Reserved** | `true` | `false` |
| **CLI Flag** | `--is-linux` | (none) |
| **CLI Runtime Format** | `DOTNET\|9.0` | `DOTNET:9` |
| **Pipeline appType** | `webAppLinux` | `webApp` |

---

## Deployment Commands

### Create Windows App Service Plan
```powershell
az appservice plan create \
  --name reactivities-plan \
  --resource-group reactivities-rg \
  --sku B1
  # No --is-linux flag
```

### Create Windows Web App
```powershell
az webapp create \
  --name reactivities-api \
  --resource-group reactivities-rg \
  --plan reactivities-plan \
  --runtime "DOTNET:9"  # Colon, not pipe
```

---

## Quick Deployment

### Option 1: ARM Template
```powershell
.\deploy-infrastructure-cli.ps1 `
  -AppNamePrefix "myapp" `
  -SqlAdminPassword "YourPassword123!"
```

### Option 2: Setup Script
```powershell
.\setup-azure-devops.ps1 `
  -ResourceGroup "reactivities-rg" `
  -Location "eastus" `
  -ApiAppName "myapp-api" `
  -BffAppName "myapp-bff"
```

### Option 3: Azure DevOps Pipeline
- Push code to `main` or `develop` branch
- Pipeline automatically deploys to Windows App Services

---

## Verification

### Check App Service Configuration
```bash
# Verify runtime
az webapp config show \
  --name reactivities-api \
  --resource-group reactivities-rg \
  --query "netFrameworkVersion"
# Expected: "v9.0"

# Verify OS type
az appservice plan show \
  --name reactivities-plan \
  --resource-group reactivities-rg \
  --query "[kind, reserved]"
# Expected: ["app", false] or ["windows", false]
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Azure Resource Group                        │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  App Service Plan (Windows, B1)        │ │
│  │  • OS: Windows                          │ │
│  │  • Runtime: .NET 9.0                    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  API App        │  │  BFF App         │  │
│  │  • .NET 9.0     │  │  • .NET 9.0      │  │
│  │  • REST API     │  │  • React SPA     │  │
│  └─────────────────┘  └─────────────────┘  │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  SQL Server     │  │  App Insights    │  │
│  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Next Steps

### 1. Test ARM Template Deployment
```powershell
.\deploy-infrastructure-cli.ps1 `
  -ResourceGroupName "test-rg" `
  -AppNamePrefix "test-app" `
  -SqlAdminPassword "TestPassword123!"
```

### 2. Verify Resources
- Check Azure Portal
- Verify App Service Plan is Windows
- Verify both apps show .NET 9.0

### 3. Deploy Applications
```powershell
# Deploy API
dotnet publish API/API.csproj -c Release -o ./publish/api
az webapp deploy --resource-group test-rg --name test-app-api --src-path ./publish/api --type zip

# Deploy BFF (with React)
cd client && npm run build && cd ..
dotnet publish BFF/BFF.csproj -c Release -o ./publish/bff
az webapp deploy --resource-group test-rg --name test-app-bff --src-path ./publish/bff --type zip
```

### 4. Test Application
```powershell
# Test API
curl https://test-app-api.azurewebsites.net/api/activities

# Test BFF (Frontend)
Start-Process https://test-app-bff.azurewebsites.net
```

---

## Benefits of Windows App Services

✅ **Native .NET Support** - Better integration with .NET Framework and .NET Core  
✅ **Familiar Environment** - Windows-based tools and diagnostics  
✅ **IIS Features** - Access to IIS-specific features and modules  
✅ **Cost** - Same pricing as Linux plans  
✅ **.NET 9.0** - Full support for latest .NET version  

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT_COMPLETE.md` | Complete migration summary |
| `WINDOWS_MIGRATION_SUMMARY.md` | Detailed migration changes |
| `WINDOWS_APP_SERVICE_REFERENCE.md` | Quick reference guide |
| `AZURE_DEPLOYMENT.md` | Manual deployment guide |
| `AZURE_DEVOPS_DEPLOYMENT.md` | CI/CD deployment guide |
| `ARM_TEMPLATE_GUIDE.md` | ARM template documentation |

---

## Support

### Common Issues

**Issue:** Deployment fails with "Invalid runtime"  
**Solution:** Ensure using `DOTNET:9` not `DOTNET|9.0`

**Issue:** App won't start  
**Solution:** Check Application Settings in Azure Portal

**Issue:** ARM template validation errors  
**Solution:** VS Code schema warnings can be ignored - template is valid

### Get Help
- Check Azure Portal → App Service → Diagnose and solve problems
- View logs: `az webapp log tail --resource-group <rg> --name <app>`
- Check Application Insights for runtime errors

---

## Migration Status

| Task | Status |
|------|--------|
| Update ARM template | ✅ Complete |
| Update Azure Pipelines | ✅ Complete |
| Update setup scripts | ✅ Complete |
| Update documentation | ✅ Complete |
| Create reference guides | ✅ Complete |
| Test deployment | ⏳ Ready to test |

---

**Migration Date:** October 12, 2025  
**Status:** ✅ Complete - Ready for Deployment  
**Platform:** Windows App Services with .NET 9.0  
**Deployment Method:** ARM Template / Azure DevOps / Manual CLI
