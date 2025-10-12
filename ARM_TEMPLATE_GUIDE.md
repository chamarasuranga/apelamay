# 🚀 ARM Template Deployment Guide

## Overview

This guide explains how to deploy the Reactivities application infrastructure to Azure using Azure Resource Manager (ARM) templates.

## What Gets Deployed

The ARM template creates all the Azure resources you need:

```
┌─────────────────────────────────────────┐
│  Resource Group                         │
│  ├─ App Service Plan (B1 Windows)        │
│  ├─ API App Service (.NET 9.0)         │
│  ├─ BFF App Service (.NET 9.0)         │
│  ├─ SQL Server + Database              │
│  └─ Application Insights               │
└─────────────────────────────────────────┘
```

### Resources Created

| Resource | Description | SKU/Tier |
|----------|-------------|----------|
| App Service Plan | Shared hosting plan | B1 (configurable) |
| API App Service | Backend API | .NET 9.0 on Windows |
| BFF App Service | Frontend + BFF | .NET 9.0 on Windows |
| SQL Server | Database server | SQL Server 12.0 |
| SQL Database | Application database | S0 Standard |
| Application Insights | Monitoring & telemetry | Standard |

## Prerequisites

1. **Azure Subscription** - [Sign up for free](https://azure.microsoft.com/free/)
2. **Choose ONE of the following:**
   - **PowerShell** with Azure PowerShell module, OR
   - **Azure CLI**

### Install Azure PowerShell (Option 1)

```powershell
Install-Module -Name Az -Repository PSGallery -Force
```

### Install Azure CLI (Option 2)

Download from: https://docs.microsoft.com/cli/azure/install-azure-cli

---

## Quick Start (3 Steps)

### Step 1: Prepare Your Password

Create a strong password for SQL Server (min 8 characters, mixed case, numbers, symbols):

```powershell
$password = ConvertTo-SecureString "YourStrongPassword123!" -AsPlainText -Force
```

### Step 2: Deploy Infrastructure

**Using Azure PowerShell:**
```powershell
.\deploy-infrastructure.ps1 `
    -ResourceGroupName "reactivities-rg" `
    -Location "eastus" `
    -AppNamePrefix "myapp" `
    -SqlAdminPassword $password `
    -AppServicePlanSku "B1"
```

**Using Azure CLI:**
```powershell
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "reactivities-rg" `
    -Location "eastus" `
    -AppNamePrefix "myapp" `
    -SqlAdminPassword "YourStrongPassword123!"
```

### Step 3: Deploy Applications

After infrastructure is created, deploy your code:
```powershell
# Deploy API
dotnet publish API/API.csproj -c Release -o ./publish/api
az webapp deploy --resource-group reactivities-rg --name myapp-api --src-path ./publish/api --type zip

# Build React and deploy BFF
cd client && npm run build && cd ..
dotnet publish BFF/BFF.csproj -c Release -o ./publish/bff
az webapp deploy --resource-group reactivities-rg --name myapp-bff --src-path ./publish/bff --type zip
```

---

## Detailed Deployment Options

### Option 1: Using PowerShell Script (Recommended)

The PowerShell script (`deploy-infrastructure.ps1`) provides the easiest way to deploy:

```powershell
# Minimal deployment (required parameters only)
$password = ConvertTo-SecureString "YourStrongPassword123!" -AsPlainText -Force
.\deploy-infrastructure.ps1 -SqlAdminPassword $password

# Full deployment with all options
$password = ConvertTo-SecureString "YourStrongPassword123!" -AsPlainText -Force
$cloudinarySecret = ConvertTo-SecureString "your_cloudinary_secret" -AsPlainText -Force
$resendToken = ConvertTo-SecureString "your_resend_token" -AsPlainText -Force

.\deploy-infrastructure.ps1 `
    -ResourceGroupName "reactivities-prod-rg" `
    -Location "eastus" `
    -AppNamePrefix "reactivities-prod" `
    -SqlAdminPassword $password `
    -AppServicePlanSku "B2" `
    -CloudinaryCloudName "your_cloud_name" `
    -CloudinaryApiKey "your_api_key" `
    -CloudinaryApiSecret $cloudinarySecret `
    -ResendApiToken $resendToken `
    -GitHubClientId "your_github_client_id"
```

### Option 2: Using Azure CLI Script

```powershell
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "reactivities-rg" `
    -AppNamePrefix "myapp" `
    -SqlAdminPassword "YourStrongPassword123!"
```

### Option 3: Manual Deployment with Azure Portal

1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Resource Group**:
   - Click "Resource groups" → "Create"
   - Name: `reactivities-rg`
   - Region: `East US`

3. **Deploy Template**:
   - Go to your resource group
   - Click "Deploy a custom template"
   - Click "Build your own template in the editor"
   - Copy and paste content from `azure-deploy.json`
   - Click "Save"
   - Fill in parameters
   - Click "Review + create" → "Create"

### Option 4: Using Parameters File

1. **Edit parameters file**: `azure-deploy.parameters.json`
   ```json
   {
     "parameters": {
       "appNamePrefix": {
         "value": "myapp"
       },
       "sqlAdministratorPassword": {
         "value": "YourStrongPassword123!"
       }
     }
   }
   ```

2. **Deploy**:
   ```powershell
   # Using Azure PowerShell
   New-AzResourceGroupDeployment `
       -ResourceGroupName "reactivities-rg" `
       -TemplateFile "azure-deploy.json" `
       -TemplateParameterFile "azure-deploy.parameters.json"

   # Using Azure CLI
   az deployment group create `
       --resource-group reactivities-rg `
       --template-file azure-deploy.json `
       --parameters @azure-deploy.parameters.json
   ```

---

## Parameters Reference

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `sqlAdministratorPassword` | securestring | SQL Server admin password (min 8 chars) | `P@ssw0rd123!` |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `appNamePrefix` | string | `reactivities` | Prefix for all resource names. Must be globally unique! |
| `location` | string | Resource Group location | Azure region (e.g., `eastus`, `westus2`) |
| `appServicePlanSku` | string | `B1` | App Service Plan SKU (F1, B1, B2, B3, S1, S2, S3, P1v2, etc.) |
| `sqlAdministratorLogin` | string | `sqladmin` | SQL Server admin username |
| `databaseName` | string | `reactivitiesdb` | SQL Database name |
| `cloudinaryCloudName` | string | `""` | Cloudinary cloud name (for image uploads) |
| `cloudinaryApiKey` | string | `""` | Cloudinary API key |
| `cloudinaryApiSecret` | securestring | `""` | Cloudinary API secret |
| `resendApiToken` | securestring | `""` | Resend API token (for emails) |
| `githubClientId` | string | `""` | GitHub OAuth client ID |

---

## SKU/Pricing Tiers

### App Service Plan SKUs

| SKU | Name | Cores | RAM | Cost/Month (approx) | Use Case |
|-----|------|-------|-----|---------------------|----------|
| F1 | Free | Shared | 1 GB | Free | Development only |
| B1 | Basic | 1 | 1.75 GB | $13 | Small apps, testing |
| B2 | Basic | 2 | 3.5 GB | $26 | Small production |
| B3 | Basic | 4 | 7 GB | $52 | Medium production |
| S1 | Standard | 1 | 1.75 GB | $70 | Production with scaling |
| P1v2 | Premium | 1 | 3.5 GB | $85 | High-performance production |

**Note**: F1 (Free tier) doesn't support "Always On" and has limitations.

---

## Post-Deployment Steps

### 1. Update Configuration Files

**client/.env.production:**
```env
VITE_API_URL=/api
VITE_COMMENTS_URL=/comments
VITE_REDIRECT_URL=https://myapp-bff.azurewebsites.net/auth-callback
```

**BFF/appsettings.Production.json:**
```json
{
  "ApiUrl": "https://myapp-api.azurewebsites.net"
}
```

### 2. Add Secrets to App Services (if not provided during deployment)

```powershell
# Add Cloudinary settings
az webapp config appsettings set `
    --resource-group reactivities-rg `
    --name myapp-api `
    --settings `
        "CloudinarySettings__CloudName=your_cloud_name" `
        "CloudinarySettings__ApiKey=your_key" `
        "CloudinarySettings__ApiSecret=your_secret"

# Add email settings
az webapp config appsettings set `
    --resource-group reactivities-rg `
    --name myapp-api `
    --settings "Resend__ApiToken=your_token"
```

### 3. Run Database Migrations

```powershell
# Get connection string from deployment outputs
$connectionString = "Server=myapp-sql.database.windows.net;Database=reactivitiesdb;User Id=sqladmin;Password=YourPassword;TrustServerCertificate=true"

# Run migrations
dotnet ef database update --project API --connection $connectionString
```

### 4. Deploy Your Applications

**Manual deployment:**
```powershell
# API
dotnet publish API/API.csproj -c Release -o ./publish/api
Compress-Archive -Path ./publish/api/* -DestinationPath api.zip -Force
az webapp deploy --resource-group reactivities-rg --name myapp-api --src-path api.zip --type zip

# BFF (with React built)
cd client && npm run build && cd ..
dotnet publish BFF/BFF.csproj -c Release -o ./publish/bff
Compress-Archive -Path ./publish/bff/* -DestinationPath bff.zip -Force
az webapp deploy --resource-group reactivities-rg --name myapp-bff --src-path bff.zip --type zip
```

**Or set up CI/CD:**
- Use `azure-pipelines.yml` for Azure DevOps
- See `AZURE_DEVOPS_DEPLOYMENT.md` for details

---

## Outputs

After successful deployment, you'll get:

```json
{
  "apiAppUrl": "https://myapp-api.azurewebsites.net",
  "bffAppUrl": "https://myapp-bff.azurewebsites.net",
  "sqlServerFqdn": "myapp-sql.database.windows.net",
  "applicationInsightsInstrumentationKey": "xxx-xxx-xxx",
  "resourceGroupName": "reactivities-rg"
}
```

These are also saved to `deployment-outputs.json` for reference.

---

## Troubleshooting

### Deployment Failed

**View deployment details:**
```powershell
# Azure PowerShell
Get-AzResourceGroupDeployment -ResourceGroupName reactivities-rg

# Azure CLI
az deployment group list --resource-group reactivities-rg --output table
```

**View specific deployment errors:**
```powershell
# Azure PowerShell
Get-AzResourceGroupDeploymentOperation `
    -ResourceGroupName reactivities-rg `
    -DeploymentName <deployment-name>

# Azure CLI
az deployment group show `
    --resource-group reactivities-rg `
    --name <deployment-name>
```

### Common Issues

**Issue**: App name already exists
- **Solution**: Change `appNamePrefix` parameter to something unique

**Issue**: SQL password doesn't meet requirements
- **Solution**: Ensure password is at least 8 characters with uppercase, lowercase, numbers, and symbols

**Issue**: Quota exceeded
- **Solution**: Check your Azure subscription quotas and limits

**Issue**: Location not available
- **Solution**: Try different Azure region (e.g., `westus2`, `northeurope`)

### Validate Before Deployment

Test the template without deploying:
```powershell
# Azure PowerShell
Test-AzResourceGroupDeployment `
    -ResourceGroupName reactivities-rg `
    -TemplateFile azure-deploy.json `
    -TemplateParameterObject @{sqlAdministratorPassword=(ConvertTo-SecureString "Test123!" -AsPlainText -Force)}

# Azure CLI
az deployment group validate `
    --resource-group reactivities-rg `
    --template-file azure-deploy.json `
    --parameters sqlAdministratorPassword="Test123!"
```

---

## Updating Existing Deployment

To update an existing deployment (e.g., change SKU or add settings):

```powershell
# Just run the deployment script again
.\deploy-infrastructure.ps1 `
    -ResourceGroupName "reactivities-rg" `
    -AppServicePlanSku "B2" `
    -SqlAdminPassword $password
```

ARM templates are **idempotent** - they'll only change what's different.

---

## Cost Management

### Estimated Monthly Costs

**Basic Setup (B1):**
- App Service Plan B1: ~$13/month
- SQL Database S0: ~$15/month
- Application Insights: ~$2-5/month (based on usage)
- **Total**: ~$30-35/month

**Free Tier (F1) - Development Only:**
- App Service Plan F1: Free
- SQL Database S0: ~$15/month
- **Total**: ~$15/month

### Stop Resources to Save Costs

```powershell
# Stop App Services (when not in use)
az webapp stop --resource-group reactivities-rg --name myapp-api
az webapp stop --resource-group reactivities-rg --name myapp-bff

# Start them again
az webapp start --resource-group reactivities-rg --name myapp-api
az webapp start --resource-group reactivities-rg --name myapp-bff
```

---

## Cleanup

To delete all resources:

```powershell
# Delete resource group and all resources
az group delete --name reactivities-rg --yes --no-wait
```

---

## CI/CD Integration

### Integrate with Azure DevOps

After infrastructure is deployed, set up CI/CD:

1. Use the ARM template in your pipeline:
```yaml
- task: AzureResourceManagerTemplateDeployment@3
  inputs:
    deploymentScope: 'Resource Group'
    azureResourceManagerConnection: 'AzureServiceConnection'
    subscriptionId: 'your-subscription-id'
    action: 'Create Or Update Resource Group'
    resourceGroupName: 'reactivities-rg'
    location: 'East US'
    templateLocation: 'Linked artifact'
    csmFile: 'azure-deploy.json'
    csmParametersFile: 'azure-deploy.parameters.json'
```

2. Then deploy applications using the existing pipelines

---

## Summary

✅ **Complete Infrastructure as Code** - Everything defined in ARM template  
✅ **One Command Deployment** - Deploy all resources at once  
✅ **Repeatable** - Same results every time  
✅ **Version Controlled** - Track infrastructure changes in Git  
✅ **Cost Effective** - Pay only for what you use  
✅ **Production Ready** - Includes monitoring and security best practices  

**Files:**
- `azure-deploy.json` - ARM template
- `azure-deploy.parameters.json` - Parameters file
- `deploy-infrastructure.ps1` - PowerShell deployment script
- `deploy-infrastructure-cli.ps1` - Azure CLI deployment script
- `ARM_TEMPLATE_GUIDE.md` - This guide

**Next Steps:**
1. Review and customize `azure-deploy.parameters.json`
2. Run deployment script
3. Deploy your applications
4. Access your app at the BFF URL

Your infrastructure is now ready for deployment! 🚀
