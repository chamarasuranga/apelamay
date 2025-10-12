# ARM Template Quick Reference

## 🚀 Deploy in 3 Commands

```powershell
# 1. Login
Connect-AzAccount

# 2. Set password
$password = ConvertTo-SecureString "YourPassword123!" -AsPlainText -Force

# 3. Deploy
.\deploy-infrastructure.ps1 -SqlAdminPassword $password
```

## 📋 What Gets Created

- ✅ App Service Plan (Windows, B1)
- ✅ API App Service (.NET 9.0)
- ✅ BFF App Service (.NET 9.0) 
- ✅ SQL Server + Database
- ✅ Application Insights

## 💰 Cost

**Basic Setup**: ~$30/month
- App Service Plan B1: $13
- SQL Database S0: $15
- Application Insights: $2-5

## 🎯 Common Commands

### Deploy
```powershell
# Minimal
.\deploy-infrastructure.ps1 -SqlAdminPassword $password

# Custom name
.\deploy-infrastructure.ps1 `
    -AppNamePrefix "myapp" `
    -SqlAdminPassword $password

# Production with B2
.\deploy-infrastructure.ps1 `
    -AppNamePrefix "prod" `
    -AppServicePlanSku "B2" `
    -SqlAdminPassword $password
```

### Using Azure CLI
```powershell
az login
.\deploy-infrastructure-cli.ps1 `
    -AppNamePrefix "myapp" `
    -SqlAdminPassword "YourPassword123!"
```

### Update Configuration
```powershell
# Add secrets after deployment
az webapp config appsettings set `
    --resource-group reactivities-rg `
    --name myapp-api `
    --settings "CloudinarySettings__ApiSecret=your_secret"
```

### Deploy Applications
```powershell
# API
dotnet publish API/API.csproj -c Release -o ./api
az webapp deploy --resource-group reactivities-rg --name myapp-api --src-path ./api --type zip

# BFF (after building React)
cd client && npm run build && cd ..
dotnet publish BFF/BFF.csproj -c Release -o ./bff
az webapp deploy --resource-group reactivities-rg --name myapp-bff --src-path ./bff --type zip
```

### View Logs
```powershell
az webapp log tail --resource-group reactivities-rg --name myapp-api
az webapp log tail --resource-group reactivities-rg --name myapp-bff
```

### Cleanup
```powershell
az group delete --name reactivities-rg --yes
```

## 🔍 Troubleshooting

```powershell
# View deployments
az deployment group list --resource-group reactivities-rg --output table

# Test before deploying
Test-AzResourceGroupDeployment `
    -ResourceGroupName reactivities-rg `
    -TemplateFile azure-deploy.json

# Stop/Start to save costs
az webapp stop --resource-group reactivities-rg --name myapp-api
az webapp start --resource-group reactivities-rg --name myapp-api
```

## 📦 Files

- `azure-deploy.json` - ARM template
- `azure-deploy.parameters.json` - Parameters
- `deploy-infrastructure.ps1` - Deployment script
- `ARM_TEMPLATE_GUIDE.md` - Full guide

## 🎉 After Deployment

1. **Update config files**:
   - `client/.env.production`
   - `BFF/appsettings.Production.json`

2. **Deploy apps**:
   - Build and deploy API
   - Build React and deploy BFF

3. **Access**:
   - Frontend: `https://myapp-bff.azurewebsites.net`
   - API: `https://myapp-api.azurewebsites.net`

## ⚠️ Important

- **App name must be globally unique** - Change `appNamePrefix`
- **SQL password requirements**: Min 8 chars, uppercase, lowercase, numbers, symbols
- **Free tier (F1)**: Development only, has limitations
- **Always On**: Not available on F1 tier

## 🔗 Resources

- Full Guide: `ARM_TEMPLATE_GUIDE.md`
- Azure DevOps: `AZURE_DEVOPS_DEPLOYMENT.md`
- Azure Portal: https://portal.azure.com
