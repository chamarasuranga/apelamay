# 🚀 Azure Deployment Guide

## Architecture
```
Internet
   ↓
┌─────────────────────────────────┐
│  Azure App Service (BFF)        │
│  https://your-bff.azurewebsites.net
│  - Serves React SPA             │
│  - Handles authentication       │
│  - Proxies to API               │
└────────────┬────────────────────┘
             │
             ↓ HTTPS
┌─────────────────────────────────┐
│  Azure App Service (API)        │
│  https://your-api.azurewebsites.net
│  - Business logic               │
│  - Database access              │
│  - Backend services             │
└─────────────────────────────────┘
```

## Prerequisites

1. **Azure Account** - [Sign up for free](https://azure.microsoft.com/free/)
2. **Azure CLI** - [Install](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **Node.js** - For building React app
4. **.NET SDK** - For building C# projects

## Step 1: Create Azure Resources

### Login to Azure
```powershell
az login
```

### Create Resource Group
```powershell
az group create --name reactivities-rg --location eastus
```

### Create App Service Plan (for both apps)
```powershell
# Create a shared App Service Plan (B1 tier or higher)
az appservice plan create `
  --name reactivities-plan `
  --resource-group reactivities-rg `
  --sku B1
```

### Create API App Service
```powershell
az webapp create `
  --name reactivities-api `
  --resource-group reactivities-rg `
  --plan reactivities-plan `
  --runtime "DOTNET:9"
```

### Create BFF App Service
```powershell
az webapp create `
  --name reactivities-bff `
  --resource-group reactivities-rg `
  --plan reactivities-plan `
  --runtime "DOTNET:9"
```

### Create SQL Database (if needed)
```powershell
# Create SQL Server
az sql server create `
  --name reactivities-sql `
  --resource-group reactivities-rg `
  --location eastus `
  --admin-user sqladmin `
  --admin-password "YourSecurePassword123!"

# Create Database
az sql db create `
  --resource-group reactivities-rg `
  --server reactivities-sql `
  --name reactivities-db `
  --service-objective S0

# Allow Azure services to access
az sql server firewall-rule create `
  --resource-group reactivities-rg `
  --server reactivities-sql `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

## Step 2: Configure Environment Variables

### Configure API App Settings
```powershell
az webapp config appsettings set `
  --resource-group reactivities-rg `
  --name reactivities-api `
  --settings `
    ASPNETCORE_ENVIRONMENT="Production" `
    "ConnectionStrings__DefaultConnection=Server=reactivities-sql.database.windows.net;Database=reactivities-db;User Id=sqladmin;Password=YourSecurePassword123!;TrustServerCertificate=true" `
    "CloudinarySettings__CloudName=YOUR_CLOUDINARY_NAME" `
    "CloudinarySettings__ApiKey=YOUR_CLOUDINARY_KEY" `
    "CloudinarySettings__ApiSecret=YOUR_CLOUDINARY_SECRET" `
    "Resend__ApiToken=YOUR_RESEND_TOKEN"
```

### Configure BFF App Settings
```powershell
az webapp config appsettings set `
  --resource-group reactivities-rg `
  --name reactivities-bff `
  --settings `
    ASPNETCORE_ENVIRONMENT="Production" `
    "ApiUrl=https://reactivities-api.azurewebsites.net"
```

## Step 3: Update Configuration Files

### Update `client/.env.production`
```bash
VITE_API_URL=/api
VITE_COMMENTS_URL=/comments
VITE_GIHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
VITE_REDIRECT_URL=https://reactivities-bff.azurewebsites.net/auth-callback
```

### Update `BFF/appsettings.Production.json`
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ApiUrl": "https://reactivities-api.azurewebsites.net"
}
```

### Update `API/appsettings.Production.json`
Add your production settings (connection strings, etc.)

## Step 4: Deploy Applications

### Option A: Using PowerShell Scripts

#### Deploy API
```powershell
# From solution root
.\deploy-api.ps1

# Then deploy
az webapp deploy `
  --resource-group reactivities-rg `
  --name reactivities-api `
  --src-path ./publish/api `
  --type zip
```

#### Deploy BFF (with React SPA)
```powershell
# From solution root
.\deploy-bff.ps1

# Then deploy
az webapp deploy `
  --resource-group reactivities-rg `
  --name reactivities-bff `
  --src-path ./publish/bff `
  --type zip
```

### Option B: Manual Deployment

#### Deploy API Manually
```powershell
# Build API
dotnet publish API/API.csproj -c Release -o ./publish/api

# Zip the output
Compress-Archive -Path ./publish/api/* -DestinationPath api-deploy.zip -Force

# Deploy
az webapp deploy `
  --resource-group reactivities-rg `
  --name reactivities-api `
  --src-path api-deploy.zip `
  --type zip
```

#### Deploy BFF Manually
```powershell
# Build React app
cd client
npm install
npm run build

# Build BFF
cd ..
dotnet publish BFF/BFF.csproj -c Release -o ./publish/bff

# Zip the output
Compress-Archive -Path ./publish/bff/* -DestinationPath bff-deploy.zip -Force

# Deploy
az webapp deploy `
  --resource-group reactivities-rg `
  --name reactivities-bff `
  --src-path bff-deploy.zip `
  --type zip
```

### Option C: Using GitHub Actions (CI/CD)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'
      
      - name: Build API
        run: dotnet publish API/API.csproj -c Release -o ./api-output
      
      - name: Deploy to Azure API
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'reactivities-api'
          publish-profile: ${{ secrets.AZURE_API_PUBLISH_PROFILE }}
          package: ./api-output

  deploy-bff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build React App
        run: |
          cd client
          npm install
          npm run build
        - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'
      
      - name: Build BFF
        run: dotnet publish BFF/BFF.csproj -c Release -o ./bff-output
      
      - name: Deploy to Azure BFF
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'reactivities-bff'
          publish-profile: ${{ secrets.AZURE_BFF_PUBLISH_PROFILE }}
          package: ./bff-output
```

## Step 5: Configure CORS and Security

### Enable HTTPS Only
```powershell
# For API
az webapp update `
  --resource-group reactivities-rg `
  --name reactivities-api `
  --https-only true

# For BFF
az webapp update `
  --resource-group reactivities-rg `
  --name reactivities-bff `
  --https-only true
```

### Configure Custom Domain (Optional)
```powershell
# Map custom domain
az webapp config hostname add `
  --resource-group reactivities-rg `
  --webapp-name reactivities-bff `
  --hostname www.yourdomain.com
```

## Step 6: Database Migration

Run migrations on Azure:
```powershell
# Option 1: Run from local machine
dotnet ef database update --project API --connection "YOUR_AZURE_SQL_CONNECTION_STRING"

# Option 2: SSH into API App Service and run migrations
az webapp ssh --resource-group reactivities-rg --name reactivities-api
cd /home/site/wwwroot
dotnet ef database update
```

## Step 7: Testing

### Test API
```powershell
curl https://reactivities-api.azurewebsites.net/api/activities
```

### Test BFF
Open browser to: `https://reactivities-bff.azurewebsites.net`

## Monitoring and Troubleshooting

### View Logs
```powershell
# API logs
az webapp log tail --resource-group reactivities-rg --name reactivities-api

# BFF logs
az webapp log tail --resource-group reactivities-rg --name reactivities-bff
```

### Enable Application Insights
```powershell
az monitor app-insights component create `
  --app reactivities-insights `
  --location eastus `
  --resource-group reactivities-rg
```

## Cost Estimation

- **App Service Plan (B1)**: ~$13/month
- **SQL Database (S0)**: ~$15/month
- **Total**: ~$28/month for basic setup

## Cleanup (Remove all resources)

```powershell
az group delete --name reactivities-rg --yes
```

## Summary

✅ **BFF App Service**: Serves React SPA and proxies to API  
✅ **API App Service**: Handles backend logic  
✅ **SQL Database**: Stores application data  
✅ **Configuration**: Environment-based settings  
✅ **Security**: HTTPS enforced  
✅ **CI/CD**: GitHub Actions for automated deployment  

Your application is now deployed and accessible at:
- **Frontend**: https://reactivities-bff.azurewebsites.net
- **API**: https://reactivities-api.azurewebsites.net (internal only)
