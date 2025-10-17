# Multi-Environment Deployment Guide

## Overview

Your application now supports **three separate environments**:
- **INT** (Integration) - Development/testing
- **UAT** (User Acceptance Testing) - Pre-production testing
- **PROD** (Production) - Live environment

Each environment has:
- ✅ Separate Azure SQL Database
- ✅ Separate App Services (API + BFF)
- ✅ Separate Application Insights
- ✅ Isolated configurations

## Resource Naming Convention

Resources are named using the pattern: `{prefix}-{environment}-{type}`

### Example:
```
Prefix: apelamay
Environment: int, uat, prod

Resources created:
├── apelamay-int-rg (Resource Group)
├── apelamay-int-api (API App Service)
├── apelamay-int-bff (BFF App Service)
├── apelamay-int-sql (SQL Server)
├── apelamay-int-db (Database)
└── apelamay-int-insights (App Insights)
```

## Deployment Strategy

### Branch → Environment Mapping

| Branch | Environment | Triggers |
|--------|------------|----------|
| `develop` | **INT** | Automatic on push |
| `uat` | **UAT** | Automatic on push |
| `main` | **PROD** | Automatic on push |

## Setup Instructions

### Step 1: Deploy Infrastructure for Each Environment

Deploy each environment separately using the deployment script:

#### Deploy INT Environment
```powershell
.\deploy-environment.ps1 -Environment int
# Enter SQL password when prompted
```

#### Deploy UAT Environment
```powershell
.\deploy-environment.ps1 -Environment uat
# Enter SQL password when prompted
```

#### Deploy PROD Environment
```powershell
.\deploy-environment.ps1 -Environment prod
# Enter SQL password when prompted
```

### Step 2: Create Git Branches

```powershell
# Create develop branch for INT
git checkout -b develop
git push -u origin develop

# Create uat branch
git checkout -b uat
git push -u origin uat

# Main branch already exists for PROD
git checkout main
```

### Step 3: Azure DevOps Pipeline Setup

The API pipeline (`azure-pipelines-api.yml`) automatically deploys to the correct environment based on the branch:

1. **Create the pipeline** in Azure DevOps
2. **Configure branch policies** (optional but recommended)
3. **Push to respective branches** to trigger deployments

## Connection Strings

Each environment has its own SQL Database connection string, automatically configured by the ARM template:

### INT Environment
```
Server: apelamay-int-sql.database.windows.net
Database: apelamay-int-db
```

### UAT Environment
```
Server: apelamay-uat-sql.database.windows.net
Database: apelamay-uat-db
```

### PROD Environment
```
Server: apelamay-prod-sql.database.windows.net
Database: apelamay-prod-db
```

Connection strings are stored in Azure App Service configuration and **automatically injected** at runtime.

## Database Migrations

Run migrations separately for each environment:

### Option 1: Using dotnet ef (Local)

```powershell
# Set connection string for target environment
$env:ConnectionStrings__DefaultConnection = "Server=apelamay-int-sql.database.windows.net..."

# Run migrations
cd API
dotnet ef database update
```

### Option 2: Using Azure CLI

```powershell
# Connect to Azure
az login

# Run migrations via Kudu/SCM
az webapp ssh --name apelamay-int-api --resource-group apelamay-int-rg
dotnet ef database update --project /home/site/wwwroot/API.dll
```

### Option 3: Add Migration Task to Pipeline (Recommended)

Add this step to your pipeline after deployment:

```yaml
- task: DotNetCoreCLI@2
  displayName: 'Run Database Migrations'
  inputs:
    command: 'custom'
    custom: 'ef'
    arguments: 'database update --project API/API.csproj'
  env:
    ConnectionStrings__DefaultConnection: $(sqlConnectionString)
```

## Application URLs

### INT Environment
- API: `https://apelamay-int-api.azurewebsites.net`
- BFF: `https://apelamay-int-bff.azurewebsites.net`

### UAT Environment
- API: `https://apelamay-uat-api.azurewebsites.net`
- BFF: `https://apelamay-uat-bff.azurewebsites.net`

### PROD Environment
- API: `https://apelamay-prod-api.azurewebsites.net`
- BFF: `https://apelamay-prod-bff.azurewebsites.net`

## Deployment Workflow

### Typical Development Flow:

1. **Develop Feature**
   ```powershell
   git checkout develop
   # Make changes
   git commit -m "Add new feature"
   git push
   # → Auto-deploys to INT
   ```

2. **Test in INT**
   - Test at `https://apelamay-int-bff.azurewebsites.net`
   - Verify API at `https://apelamay-int-api.azurewebsites.net`

3. **Promote to UAT**
   ```powershell
   git checkout uat
   git merge develop
   git push
   # → Auto-deploys to UAT
   ```

4. **User Acceptance Testing**
   - Business users test at `https://apelamay-uat-bff.azurewebsites.net`
   - Sign-off on features

5. **Release to PROD**
   ```powershell
   git checkout main
   git merge uat
   git push
   # → Auto-deploys to PROD
   ```

## Environment-Specific Configuration

### App Settings (Configured in ARM Template)

Each environment can have different settings for:
- Cloudinary credentials
- Resend API tokens
- OAuth client IDs
- Feature flags

Update these in the ARM template parameters or manually in Azure Portal.

### Example: Different Cloudinary Accounts

Deploy INT with test credentials:
```powershell
.\deploy-environment.ps1 -Environment int `
    -CloudinaryCloudName "test-cloud" `
    -CloudinaryApiKey "test-key"
```

Deploy PROD with production credentials:
```powershell
.\deploy-environment.ps1 -Environment prod `
    -CloudinaryCloudName "prod-cloud" `
    -CloudinaryApiKey "prod-key"
```

## Cost Considerations

### Monthly Costs (Approximate AUD)

| Environment | App Service (B1) | SQL (S1) | Total/Month |
|-------------|-----------------|----------|-------------|
| INT | $13 | $23 | ~$36 |
| UAT | $13 | $23 | ~$36 |
| PROD | $13 | $23 | ~$36 |
| **Total** | **$39** | **$69** | **~$108** |

### Cost Optimization Options:

1. **Use Shared App Service Plan**
   - Run INT and UAT on same plan
   - Saves ~$13/month

2. **Lower Database Tier for INT/UAT**
   - Use Basic tier for non-prod: ~$7/month
   - Saves ~$32/month

3. **Auto-Shutdown for Non-Prod**
   - Stop INT/UAT during off-hours
   - Use Azure Automation or DevOps schedules

## Monitoring

Each environment has its own Application Insights instance:

- **INT**: `apelamay-int-insights`
- **UAT**: `apelamay-uat-insights`
- **PROD**: `apelamay-prod-insights`

View logs and metrics in Azure Portal → Application Insights.

## Troubleshooting

### Connection String Not Found

If the app can't connect to the database:

1. Check Azure Portal → App Service → Configuration → Connection strings
2. Verify `DefaultConnection` exists
3. Check the connection string format

### Wrong Environment Deployed

Check the pipeline:
1. Pipelines → Recent runs
2. Verify which stage ran
3. Check branch conditions in YAML

### Database Migration Issues

```powershell
# Check current migration status
dotnet ef migrations list

# Check database connection
dotnet ef database update --verbose
```

## Summary

✅ **3 Environments**: INT, UAT, PROD
✅ **Separate Databases**: Each with own connection string  
✅ **Branch-Based Deployment**: develop → INT, uat → UAT, main → PROD  
✅ **Automated Pipelines**: Push to deploy  
✅ **Isolated Configurations**: Per-environment settings  

Happy deploying! 🚀
