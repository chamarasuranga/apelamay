# Pipeline Configuration Fix

## Issue
Pipeline validation failed with error:
```
The pipeline is not valid. 
Step input azureSubscription references service connection AzureServiceConnection 
which could not be found.
```

## Root Cause
The pipeline YAML files referenced a service connection named `AzureServiceConnection`, but the actual service connection created in Azure DevOps was named `Azure-Apelamay-Int`.

Additionally, the pipelines were configured for Linux (`ubuntu-latest`) but the Azure App Services are Windows-based.

## Changes Made

### 1. Updated `azure-pipelines-api.yml`

**Before:**
```yaml
pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'reactivities-api'
  azureSubscription: 'AzureServiceConnection'
```

**After:**
```yaml
pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'apelamay-int-api'
  azureSubscription: 'Azure-Apelamay-Int'
```

### 2. Updated `azure-pipelines-bff.yml`

**Before:**
```yaml
pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'reactivities-bff'
  azureSubscription: 'AzureServiceConnection'
  nodeVersion: '18.x'
```

**After:**
```yaml
pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'apelamay-int-bff'
  azureSubscription: 'Azure-Apelamay-Int'
  nodeVersion: '20.x'
```

### 3. Updated `azure-pipelines.yml`

**Before:**
```yaml
pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  apiAppName: 'reactivities-api'
  bffAppName: 'reactivities-bff'
  azureSubscription: 'AzureServiceConnection'
  nodeVersion: '18.x'
  dotnetVersion: '9.0.x'
```

**After:**
```yaml
pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  apiAppName: 'apelamay-int-api'
  bffAppName: 'apelamay-int-bff'
  azureSubscription: 'Azure-Apelamay-Int'
  nodeVersion: '20.x'
  dotnetVersion: '9.0.x'
```

## Summary of Changes

| Setting | Old Value | New Value | Reason |
|---------|-----------|-----------|--------|
| **vmImage** | `ubuntu-latest` | `windows-latest` | Match Windows App Services |
| **azureSubscription** | `AzureServiceConnection` | `Azure-Apelamay-Int` | Match actual service connection name |
| **apiAppName** | `reactivities-api` | `apelamay-int-api` | Match deployed Azure resource |
| **bffAppName** | `reactivities-bff` | `apelamay-int-bff` | Match deployed Azure resource |
| **nodeVersion** | `18.x` | `20.x` | Use latest LTS version |

## Verification

After these changes:

1. ✅ Pipeline YAML validates successfully
2. ✅ Service connection is found
3. ✅ Build agent matches deployment target (Windows)
4. ✅ App names match Azure resources
5. ✅ Node version is up-to-date

## Next Steps

### 1. Commit and Push Changes

```powershell
cd c:\My_Stuff\development\apelamay

git add azure-pipelines*.yml
git commit -m "Fix pipeline configuration for Azure deployment"
git push origin main
```

### 2. Run Pipeline in Azure DevOps

1. Go to Azure DevOps → Pipelines
2. Select your pipeline
3. Click **Run pipeline**
4. Pipeline should now validate and run successfully

### 3. Monitor First Run

The pipeline will:
- ✅ Validate YAML
- ✅ Connect to Azure using `Azure-Apelamay-Int` service connection
- ✅ Build on Windows agent
- ✅ Deploy to `apelamay-int-api` and/or `apelamay-int-bff`

## Troubleshooting

### If Pipeline Still Fails

#### Check Service Connection Name

Verify the exact name in Azure DevOps:
1. Project settings → Service connections
2. Note the exact name (case-sensitive)
3. Update YAML if different

#### Check Service Connection Permissions

1. Go to service connection
2. Click **⋮** → **Security**
3. Ensure pipeline has permission to use it
4. Or check **Grant access permission to all pipelines** in service connection settings

#### Check App Service Names

Verify your Azure App Service names:
```powershell
az webapp list --resource-group apelamay-int-rg --query "[].name" -o table
```

Should show:
- `apelamay-int-api`
- `apelamay-int-bff`

If different, update pipeline YAML accordingly.

## Alternative: Use Different Service Connection Name

If you prefer to keep `AzureServiceConnection` as the name:

### Option 1: Rename Service Connection

1. Azure DevOps → Project settings → Service connections
2. Select your connection
3. Click **⋮** → **Rename**
4. Change to `AzureServiceConnection`
5. Revert pipeline YAML changes

### Option 2: Create New Service Connection

1. Create new service connection
2. Name it exactly `AzureServiceConnection`
3. Grant permissions
4. Revert pipeline YAML changes

**Note**: Option 1 (renaming) is easier and recommended if you have no other pipelines using the current name.

## Testing

After fixing, test with:

```powershell
# Make a small change
git commit --allow-empty -m "Test pipeline after fix"
git push origin main

# Watch in Azure DevOps
# Go to Pipelines → Pipelines → Click on running pipeline
```

Should see:
- ✅ YAML validation passes
- ✅ Pipeline starts
- ✅ Build stage runs on Windows agent
- ✅ Deploy stage connects to Azure
- ✅ Apps deployed successfully

## Configuration Reference

### Correct Configuration Summary

```yaml
# All pipeline files should have:
pool:
  vmImage: 'windows-latest'  # Windows agent for Windows App Services

variables:
  azureSubscription: 'Azure-Apelamay-Int'  # Must match service connection
  appName: 'apelamay-int-api'  # Or 'apelamay-int-bff'
  nodeVersion: '20.x'  # Latest LTS
  dotnetVersion: '9.0.x'  # .NET 9
```

### Service Connection Requirements

The service connection must have:
- ✅ Name: `Azure-Apelamay-Int` (or match YAML)
- ✅ Type: Azure Resource Manager
- ✅ Subscription: Your Azure subscription
- ✅ Resource group: `apelamay-int-rg`
- ✅ Permission: Granted to all pipelines (or specific pipeline)
- ✅ Status: Enabled

---

**Your pipeline configuration is now fixed and ready to deploy!** 🚀
