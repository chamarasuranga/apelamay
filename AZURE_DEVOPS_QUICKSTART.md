# Azure DevOps Quick Start Guide

## 🎯 Overview

This guide will help you set up CI/CD for deploying your Reactivities application to Azure using Azure DevOps.

**What gets deployed:**
- **API**: Backend services → Separate Azure App Service
- **BFF**: Backend-for-Frontend with React SPA → Separate Azure App Service

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Create Azure Resources

Run the setup script to create all Azure resources:

```powershell
.\setup-azure-devops.ps1 `
    -ResourceGroup "reactivities-rg" `
    -Location "eastus" `
    -ApiAppName "your-api-name" `
    -BffAppName "your-bff-name"
```

**Note:** App names must be globally unique in Azure!

### Step 2: Create Azure DevOps Project

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Click **New Project**
3. Enter project name: `Reactivities`
4. Click **Create**

### Step 3: Create Service Connection

1. In your Azure DevOps project, go to **Project Settings** (bottom left)
2. Under **Pipelines**, click **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager** → **Next**
5. Select **Service principal (automatic)**
6. Choose:
   - **Subscription**: Your Azure subscription
   - **Resource group**: `reactivities-rg` (or your resource group name)
   - **Service connection name**: `AzureServiceConnection`
7. Check **Grant access permission to all pipelines**
8. Click **Save**

### Step 4: Push Code to Repository

**Option A: Use Azure Repos**
```powershell
git remote add azure https://dev.azure.com/{your-org}/Reactivities/_git/Reactivities
git push azure main
```

**Option B: Use GitHub**
- Just connect your GitHub repository to Azure DevOps when creating the pipeline

### Step 5: Create Pipeline

1. In Azure DevOps, go to **Pipelines** → **Pipelines**
2. Click **New Pipeline**
3. Select your repository location (Azure Repos or GitHub)
4. Select **Existing Azure Pipelines YAML file**
5. Choose `/azure-pipelines.yml`
6. Click **Run**

**That's it!** Your pipeline will now:
- Build on every push to `main` or `develop`
- Deploy to Staging (for `develop` branch)
- Deploy to Production (for `main` branch with approval)

---

## 📁 Pipeline Files

### Main Pipeline (Recommended)
- **`azure-pipelines.yml`** - Single pipeline for both API and BFF
- Builds and deploys both projects
- Multi-stage with Staging and Production

### Separate Pipelines (Alternative)
- **`azure-pipelines-api.yml`** - API only pipeline
- **`azure-pipelines-bff.yml`** - BFF only pipeline
- Triggers only when relevant files change

---

## 🔧 Configuration Files

### 1. Update `client/.env.production`

```env
VITE_API_URL=/api
VITE_COMMENTS_URL=/comments
VITE_GIHUB_CLIENT_ID=your_github_client_id
VITE_REDIRECT_URL=https://your-bff-name.azurewebsites.net/auth-callback
```

### 2. Update `BFF/appsettings.Production.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ApiUrl": "https://your-api-name.azurewebsites.net"
}
```

### 3. Create `API/appsettings.Production.json` (if not exists)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Your connection string here"
  },
  "CloudinarySettings": {
    "CloudName": "your_cloudinary_name",
    "ApiKey": "your_cloudinary_key",
    "ApiSecret": "your_cloudinary_secret"
  }
}
```

---

## 🔐 Managing Secrets

### Option 1: Azure App Service Configuration

Add secrets via Azure Portal or CLI:

```powershell
az webapp config appsettings set `
  --resource-group reactivities-rg `
  --name your-api-name `
  --settings `
    "CloudinarySettings__ApiSecret=your_secret" `
    "ConnectionStrings__DefaultConnection=your_connection_string"
```

### Option 2: Azure Key Vault (Recommended for Production)

1. Create Key Vault:
```powershell
az keyvault create `
  --name reactivities-vault `
  --resource-group reactivities-rg `
  --location eastus
```

2. Add secrets:
```powershell
az keyvault secret set `
  --vault-name reactivities-vault `
  --name "CloudinaryApiSecret" `
  --value "your_secret"
```

3. Configure App Service to use Key Vault

---

## 🎯 Deployment Workflow

### Development Branch (`develop`)
```
Push to develop
  ↓
Build (API + BFF)
  ↓
Deploy to Staging (automatic)
  ↓
Smoke Tests
```

### Main Branch (`main`)
```
Push to main / Merge PR
  ↓
Build (API + BFF)
  ↓
Deploy to Production
  ↓
Manual Approval ⏸️
  ↓
Deploy
  ↓
Health Checks
  ↓
✅ Live
```

---

## 📊 Monitoring Your Deployment

### View Pipeline Runs
1. Go to **Pipelines** → **Pipelines**
2. Click on your pipeline
3. See all runs and their status

### View Deployment Logs
1. Click on a pipeline run
2. Click on a stage (Build, Deploy, etc.)
3. View detailed logs

### View Azure App Service Logs
```powershell
# API logs
az webapp log tail --resource-group reactivities-rg --name your-api-name

# BFF logs
az webapp log tail --resource-group reactivities-rg --name your-bff-name
```

---

## 🔄 Making Changes

### Update Pipeline Variables

1. Go to **Pipelines** → **Pipelines**
2. Click your pipeline → **Edit**
3. Click **Variables** (top right)
4. Add/modify variables:
   - `apiAppName`: Your API app name
   - `bffAppName`: Your BFF app name
   - `azureSubscription`: Your service connection name

### Create Variable Groups

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `Reactivities-Production`
4. Add variables (mark secrets as secret 🔒)

---

## 🚀 Advanced Features

### Add Manual Approval for Production

1. Go to **Pipelines** → **Environments**
2. Click **Production**
3. Click **︙** → **Approvals and checks**
4. Click **+** → **Approvals**
5. Add approvers
6. Click **Create**

### Add Deployment Slots (Blue-Green Deployment)

Create a staging slot:
```powershell
az webapp deployment slot create `
  --name your-bff-name `
  --resource-group reactivities-rg `
  --slot staging
```

Update pipeline to deploy to slot, then swap.

### Add Notifications

1. Go to **Project Settings** → **Service hooks**
2. Click **+** → Choose service (Slack, Teams, etc.)
3. Configure for pipeline events

---

## 🧪 Testing the Deployment

### Manual Testing

```powershell
# Test API
curl https://your-api-name.azurewebsites.net/api/activities

# Test BFF
curl https://your-bff-name.azurewebsites.net
```

### Automated Testing

Add to your pipeline:
```yaml
- task: PowerShell@2
  displayName: 'Run Integration Tests'
  inputs:
    targetType: 'inline'
    script: |
      # Your test commands
      dotnet test
```

---

## 🐛 Troubleshooting

### Pipeline fails on build
- Check build logs for specific errors
- Ensure all dependencies are restored
- Verify .NET and Node.js versions

### Deployment fails
- Check service connection is valid
- Verify app names are correct
- Check Azure App Service status

### App doesn't start
- Check App Service logs
- Verify environment variables
- Check `appsettings.Production.json`

### Can't access app
- Verify HTTPS is enabled
- Check if app has warmed up (takes 30-60 seconds)
- Check firewall rules

---

## 📝 Checklist

- [ ] Azure resources created
- [ ] Service connection configured
- [ ] Pipeline file committed
- [ ] Environment variables updated
- [ ] Secrets configured
- [ ] Pipeline created in Azure DevOps
- [ ] First deployment successful
- [ ] App accessible via URLs
- [ ] Approvals configured (if needed)
- [ ] Monitoring enabled

---

## 🎉 Success!

Your application should now be deployed:

- **Frontend**: https://your-bff-name.azurewebsites.net
- **API**: https://your-api-name.azurewebsites.net

Every push to `main` will automatically deploy to production (after approval).
Every push to `develop` will automatically deploy to staging.

---

## 🔗 Useful Links

- [Azure DevOps Documentation](https://docs.microsoft.com/azure/devops/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [YAML Pipeline Reference](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

---

## 🆘 Need Help?

- Check the detailed guide: `AZURE_DEVOPS_DEPLOYMENT.md`
- Review pipeline logs in Azure DevOps
- Check Azure App Service logs
- Contact your DevOps team
