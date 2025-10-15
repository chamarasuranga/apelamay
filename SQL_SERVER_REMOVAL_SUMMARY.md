# SQL Server Resources Removal Summary

## Overview
Removed all SQL Server and Azure SQL Database resources from the ARM template and deployment scripts since they are not needed for this application.

## Changes Made

### 1. ARM Template (`azure-deploy.json`)

#### Parameters Removed
- `sqlAdministratorLogin` - SQL Server admin username
- `sqlAdministratorPassword` - SQL Server admin password (secure string)
- `databaseName` - SQL Database name

#### Variables Removed
- `sqlServerName` - Name for SQL Server resource

#### Resources Removed
- **Microsoft.Sql/servers** - Azure SQL Server instance
  - Including nested database resource
  - Including firewall rules

#### Dependencies Removed
- Removed SQL Server dependency from API App Service
- API App Service now only depends on:
  - App Service Plan
  - Application Insights

#### App Settings Removed
- Removed `connectionStrings` section from API App Service
- Removed `DefaultConnection` connection string

#### Outputs Removed
- `sqlServerFqdn` - SQL Server fully qualified domain name

### 2. Deployment Script (`deploy-infrastructure-cli.ps1`)

#### Output Changes
Replaced database information section with monitoring information:

**Before:**
```powershell
Write-Host "🗄️ Database:"
Write-Host "   SQL Server: $($result.properties.outputs.sqlServerFqdn.value)"
```

**After:**
```powershell
Write-Host "📊 Monitoring:"
Write-Host "   Application Insights Key: $($result.properties.outputs.applicationInsightsInstrumentationKey.value)"
```

#### Next Steps Updated
Enhanced deployment guidance:
```powershell
Write-Host "🔧 Next Steps:"
Write-Host "   1. Deploy your API application to: $($result.properties.outputs.apiAppUrl.value)"
Write-Host "   2. Deploy your BFF application to: $($result.properties.outputs.bffAppUrl.value)"
Write-Host "   3. Configure any additional app settings (OAuth, Cloudinary, etc.)"
Write-Host "   4. Visit your application: $($result.properties.outputs.bffAppUrl.value)"
```

## Remaining Configuration

The ARM template still supports (as optional parameters):
- ✅ Cloudinary (image hosting)
- ✅ Resend (email service)
- ✅ GitHub OAuth
- ✅ Application Insights (monitoring)

## Resources That Will Be Created

When you run the deployment, these resources will be created:

1. **App Service Plan** (`apelamay-int-plan`)
   - Windows-based
   - SKU: B1 (Basic)
   - Location: Australia Southeast

2. **API App Service** (`apelamay-int-api`)
   - .NET 9.0
   - HTTPS only
   - Connected to Application Insights

3. **BFF App Service** (`apelamay-int-bff`)
   - .NET 9.0
   - HTTPS only
   - Connected to Application Insights
   - Configured to call API

4. **Application Insights** (`apelamay-int-insights`)
   - Monitoring and telemetry
   - 90-day retention

## Cost Implications

**Monthly Cost Estimate (Australia Southeast):**
- App Service Plan (B1): ~$13 USD/month
- Application Insights: Free tier (1 GB/month included)
- **Total: ~$13 USD/month**

**Removed Costs:**
- Azure SQL Database (S0 tier): ~$15 USD/month saved

## Deployment Command

No changes needed! The deployment command remains the same:

```powershell
.\deploy-infrastructure-cli.ps1
```

Or with custom parameters:
```powershell
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-int-rg" `
    -Location "australiasoutheast" `
    -AppNamePrefix "apelamay-int" `
    -AppServicePlanSku "B1"
```

## Next Steps

1. **Login to Azure:**
   ```powershell
   az login --use-device-code
   ```

2. **Run Deployment:**
   ```powershell
   .\deploy-infrastructure-cli.ps1
   ```

3. **Deploy Applications:**
   - Use Azure DevOps pipelines
   - Or deploy manually using `dotnet publish`

## Notes

- No database password to manage
- Simplified deployment process
- Reduced monthly costs
- If you need a database later, you can:
  - Use a different cloud database service
  - Add SQL Server back to the template
  - Use Azure Cosmos DB
  - Use external database hosting
