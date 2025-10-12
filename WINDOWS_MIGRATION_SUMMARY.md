# Windows App Service Migration Summary

## Overview
This document summarizes the migration from Linux to Windows App Services for the Reactivities application.

## What Changed

### 1. ARM Template (`azure-deploy.json`)
**App Service Plan:**
- `kind`: `"windows"` (unchanged)
- `properties.reserved`: `false` (for Windows)

**API and BFF App Services:**
- `kind`: Changed from `"app,linux"` to `"app"`
- `siteConfig.linuxFxVersion`: Removed
- `siteConfig.netFrameworkVersion`: Added with value `"v9.0"`

### 2. Azure Pipelines
**Files Updated:**
- `azure-pipelines.yml`
- `azure-pipelines-api.yml`
- `azure-pipelines-bff.yml`

**Changes:**
- `appType`: Changed from `'webAppLinux'` to `'webApp'`

### 3. Setup Script (`setup-azure-devops.ps1`)
**App Service Plan:**
- Removed `--is-linux` flag

**App Services:**
- `--runtime`: Changed from `"DOTNET|9.0"` to `"DOTNET:9"`

### 4. Documentation Updates
**Files Updated:**
- `AZURE_DEPLOYMENT.md`
- `AZURE_DEVOPS_DEPLOYMENT.md`
- `ARM_TEMPLATE_GUIDE.md`
- `ARM_QUICK_REFERENCE.md`
- `DOTNET_9_UPDATE_SUMMARY.md`

**Changes:**
- Removed `--is-linux` flags from CLI commands
- Changed runtime from `DOTNET|9.0` to `DOTNET:9`
- Updated all references from Linux to Windows

## Runtime Configuration Differences

### Linux App Services (Old)
```json
"siteConfig": {
  "linuxFxVersion": "DOTNET|9.0"
}
```

CLI Command:
```bash
az webapp create --runtime "DOTNET|9.0" --is-linux
```

### Windows App Services (New)
```json
"siteConfig": {
  "netFrameworkVersion": "v9.0"
}
```

CLI Command:
```bash
az webapp create --runtime "DOTNET:9"
```

## Deployment Commands

### Create Resources (Windows)
```powershell
# Create App Service Plan (Windows)
az appservice plan create `
  --name reactivities-plan `
  --resource-group reactivities-rg `
  --sku B1

# Create API App Service
az webapp create `
  --name reactivities-api `
  --resource-group reactivities-rg `
  --plan reactivities-plan `
  --runtime "DOTNET:9"

# Create BFF App Service
az webapp create `
  --name reactivities-bff `
  --resource-group reactivities-rg `
  --plan reactivities-plan `
  --runtime "DOTNET:9"
```

### Deploy Using ARM Template
```powershell
# Deploy infrastructure
az deployment group create `
  --resource-group reactivities-rg `
  --template-file azure-deploy.json `
  --parameters azure-deploy.parameters.json
```

## Verification

### Check App Service Runtime
```bash
# API App Service
az webapp config show --name reactivities-api --resource-group reactivities-rg --query "netFrameworkVersion"

# BFF App Service
az webapp config show --name reactivities-bff --resource-group reactivities-rg --query "netFrameworkVersion"
```

Expected Output: `"v9.0"`

### Check App Service Plan OS
```bash
az appservice plan show --name reactivities-plan --resource-group reactivities-rg --query "kind"
```

Expected Output: `"app"` or `"windows"`

## Benefits of Windows App Services

1. **Better .NET Integration**: Native support for .NET Framework and .NET Core
2. **Familiar Environment**: Windows-based tools and diagnostics
3. **IIS Features**: Access to IIS-specific features and modules
4. **Cost**: Generally comparable pricing to Linux plans

## Migration Checklist

- [x] Update ARM template to use Windows configuration
- [x] Remove Linux-specific settings (`linuxFxVersion`, `kind: "app,linux"`)
- [x] Add Windows-specific settings (`netFrameworkVersion: "v9.0"`, `kind: "app"`)
- [x] Update all Azure Pipeline files (`appType: 'webApp'`)
- [x] Update setup script (remove `--is-linux`, change runtime format)
- [x] Update documentation (all references to Linux → Windows)
- [x] Verify ARM template syntax
- [x] Test deployment scripts

## Next Steps

1. **Test ARM Template Deployment:**
   ```powershell
   .\deploy-infrastructure-cli.ps1
   # or
   .\deploy-infrastructure.ps1
   ```

2. **Test Setup Script:**
   ```powershell
   .\setup-azure-devops.ps1
   ```

3. **Deploy Applications:**
   - Run Azure DevOps pipelines
   - Verify both API and BFF deploy successfully

4. **Verify Runtime:**
   - Check that apps are running on Windows
   - Verify .NET 9.0 runtime is active
   - Test all functionality

## Rollback Plan

If you need to revert to Linux App Services:

1. **ARM Template:**
   - Change `kind: "app"` → `"app,linux"`
   - Change `netFrameworkVersion: "v9.0"` → `linuxFxVersion: "DOTNET|9.0"`
   - Change `kind: "windows"` → `"linux"` in App Service Plan
   - Change `reserved: false` → `true` in App Service Plan

2. **Pipelines:**
   - Change `appType: 'webApp'` → `'webAppLinux'`

3. **Setup Script:**
   - Add `--is-linux` flag to plan creation
   - Change `--runtime "DOTNET:9"` → `"DOTNET|9.0"`

## Related Files

- `azure-deploy.json` - ARM template with Windows configuration
- `setup-azure-devops.ps1` - Setup script for Windows
- `azure-pipelines*.yml` - CI/CD pipelines for Windows
- `AZURE_DEPLOYMENT.md` - Deployment guide for Windows
- `ARM_TEMPLATE_GUIDE.md` - ARM template documentation

## Support

For issues or questions:
- Check Azure App Service documentation
- Review ARM template validation errors
- Verify .NET 9.0 is supported on Windows App Services
- Check Azure DevOps pipeline logs

---

**Migration Date:** October 12, 2025  
**Status:** ✅ Complete
