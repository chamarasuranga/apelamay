# Azure DevOps Deployment Setup Guide

## Overview
This guide walks you through setting up automated CI/CD pipelines in Azure DevOps to deploy your API and BFF applications to Azure App Services.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Azure subscription with deployed infrastructure (App Services created)
- ✅ Azure DevOps account (free at dev.azure.com)
- ✅ Your code in a Git repository
- ✅ The following Azure resources deployed:
  - `apelamay-int-api` (API App Service)
  - `apelamay-int-bff` (BFF App Service)
  - `apelamay-int-sql` (SQL Server)
  - `apelamay-int-db` (SQL Database)

---

## Part 1: Azure DevOps Project Setup

### Step 1: Create Azure DevOps Organization (if needed)

1. Go to https://dev.azure.com
2. Click **Start free** or **Sign in**
3. Create a new organization:
   - Organization name: e.g., `apelamay` or your company name
   - Region: Choose closest to you (Australia)

### Step 2: Create Project

1. In Azure DevOps, click **+ New project**
2. Configure:
   - **Project name**: `Apelamay` (or your app name)
   - **Visibility**: Private (recommended)
   - **Version control**: Git
   - **Work item process**: Agile
3. Click **Create**

### Step 3: Push Your Code to Azure Repos

**Option A: Use Azure Repos (Recommended for beginners)**

```powershell
# Navigate to your project
cd c:\My_Stuff\development\apelamay

# Initialize git if not already done
git init

# Add Azure DevOps remote
git remote add origin https://dev.azure.com/{your-org}/Apelamay/_git/Apelamay

# Add all files
git add .
git commit -m "Initial commit"

# Push to Azure DevOps
git push -u origin main
```

**Option B: Use GitHub (if you prefer)**
- Keep your code on GitHub
- Connect Azure DevOps to your GitHub repo in pipeline setup

---

## Part 2: Create Service Connection

This allows Azure DevOps to deploy to your Azure subscription.

### Step 1: Get Azure Subscription Info

```powershell
# Get your subscription ID
az account show --query id -o tsv
# Copy this ID

# Get your subscription name
az account show --query name -o tsv
```

### Step 2: Create Service Connection

1. In Azure DevOps project, go to **Project settings** (bottom left)
2. Under **Pipelines**, click **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager** → **Next**
5. Select **Service principal (automatic)** → **Next**
6. Configure:
   - **Scope level**: Subscription
   - **Subscription**: Select your Azure subscription
   - **Resource group**: `apelamay-int-rg`
   - **Service connection name**: `Azure-Apelamay-Int`
   - **Description**: Connection to apelamay-int-rg resources
   - ✅ Check **Grant access permission to all pipelines**
7. Click **Save**

**Troubleshooting:**
- If you can't see your subscription, you may need **Owner** or **Contributor** role
- Alternative: Use **Service principal (manual)** method (see Appendix A)

---

## Part 3: Create API Pipeline

### Step 1: Create Pipeline File

Your project already has `azure-pipelines-api.yml`. Let's verify it's correct:

```powershell
# Check the file
cat azure-pipelines-api.yml
```

The file should look like this (already configured for Windows):

```yaml
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - API/**
    - Application/**
    - Domain/**
    - Infrastructure/**
    - Persistence/**

pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  azureSubscription: 'Azure-Apelamay-Int'  # Must match your service connection name
  webAppName: 'apelamay-int-api'

stages:
- stage: Build
  displayName: 'Build API'
  jobs:
  - job: Build
    displayName: 'Build job'
    steps:
    - task: UseDotNet@2
      displayName: 'Use .NET 9.0'
      inputs:
        version: '9.0.x'
        includePreviewVersions: true

    - task: DotNetCoreCLI@2
      displayName: 'Restore packages'
      inputs:
        command: 'restore'
        projects: 'API/API.csproj'

    - task: DotNetCoreCLI@2
      displayName: 'Build API'
      inputs:
        command: 'build'
        projects: 'API/API.csproj'
        arguments: '--configuration $(buildConfiguration) --no-restore'

    - task: DotNetCoreCLI@2
      displayName: 'Publish API'
      inputs:
        command: 'publish'
        publishWebProjects: false
        projects: 'API/API.csproj'
        arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
        zipAfterPublish: true

    - task: PublishBuildArtifacts@1
      displayName: 'Publish artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'api-drop'

- stage: Deploy
  displayName: 'Deploy API'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: 'Deploy to Azure'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure App Service'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'  # Changed from webAppLinux to webApp for Windows
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/api-drop/*.zip'
              deploymentMethod: 'auto'
```

**Important:** Update the `azureSubscription` variable if your service connection has a different name.

### Step 2: Create Pipeline in Azure DevOps

1. In Azure DevOps, go to **Pipelines** → **Pipelines**
2. Click **New pipeline** (or **Create Pipeline**)
3. Select **Azure Repos Git** (or GitHub if using GitHub)
4. Select your repository: **Apelamay**
5. Select **Existing Azure Pipelines YAML file**
6. Choose:
   - **Branch**: main
   - **Path**: `/azure-pipelines-api.yml`
7. Click **Continue**
8. Review the YAML
9. Click **Run**

### Step 3: Monitor First Build

1. Pipeline will start automatically
2. Watch the build progress:
   - **Build stage**: Compiles .NET code (~2-5 minutes)
   - **Deploy stage**: Deploys to Azure App Service (~2-3 minutes)
3. If successful, you'll see green checkmarks ✅

**Troubleshooting:**
- **Error: "Service connection not found"**: Update `azureSubscription` in YAML
- **Error: ".NET 9.0 not found"**: Check if .NET 9 preview is available, or change to `9.x`
- **Error: "Cannot access App Service"**: Check service connection permissions

---

## Part 4: Create BFF Pipeline

### Step 1: Verify BFF Pipeline File

Check `azure-pipelines-bff.yml`:

```powershell
# Check the file
cat azure-pipelines-bff.yml
```

It should include both .NET BFF build and React client build:

```yaml
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - BFF/**
    - client/**

pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  azureSubscription: 'Azure-Apelamay-Int'  # Must match your service connection name
  webAppName: 'apelamay-int-bff'

stages:
- stage: Build
  displayName: 'Build BFF and Client'
  jobs:
  - job: Build
    displayName: 'Build job'
    steps:
    # Build React Client
    - task: NodeTool@0
      displayName: 'Install Node.js'
      inputs:
        versionSpec: '20.x'

    - script: |
        cd client
        npm install
        npm run build
      displayName: 'Build React Client'

    # Build .NET BFF
    - task: UseDotNet@2
      displayName: 'Use .NET 9.0'
      inputs:
        version: '9.0.x'
        includePreviewVersions: true

    - task: DotNetCoreCLI@2
      displayName: 'Restore BFF packages'
      inputs:
        command: 'restore'
        projects: 'BFF/BFF.csproj'

    # Copy React build to BFF wwwroot
    - task: CopyFiles@2
      displayName: 'Copy React build to BFF'
      inputs:
        SourceFolder: 'client/dist'
        Contents: '**'
        TargetFolder: 'BFF/wwwroot'

    - task: DotNetCoreCLI@2
      displayName: 'Build BFF'
      inputs:
        command: 'build'
        projects: 'BFF/BFF.csproj'
        arguments: '--configuration $(buildConfiguration) --no-restore'

    - task: DotNetCoreCLI@2
      displayName: 'Publish BFF'
      inputs:
        command: 'publish'
        publishWebProjects: false
        projects: 'BFF/BFF.csproj'
        arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
        zipAfterPublish: true

    - task: PublishBuildArtifacts@1
      displayName: 'Publish artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'bff-drop'

- stage: Deploy
  displayName: 'Deploy BFF'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: 'Deploy to Azure'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure App Service'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'  # Changed from webAppLinux to webApp for Windows
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/bff-drop/*.zip'
              deploymentMethod: 'auto'
```

### Step 2: Create BFF Pipeline

1. Go to **Pipelines** → **Pipelines**
2. Click **New pipeline**
3. Select **Azure Repos Git**
4. Select your repository
5. Select **Existing Azure Pipelines YAML file**
6. Choose:
   - **Branch**: main
   - **Path**: `/azure-pipelines-bff.yml`
7. Click **Continue**
8. Click **Run**

### Step 3: Monitor BFF Build

The BFF pipeline takes longer because it builds both React and .NET:
1. **Build React**: ~3-5 minutes (npm install + build)
2. **Build BFF**: ~2-3 minutes
3. **Deploy**: ~2-3 minutes

**Total time**: ~8-11 minutes for first build

---

## Part 5: Configure App Settings

After deploying, configure runtime settings for your apps.

### Step 1: Configure API App Settings

```powershell
# Set API configuration
az webapp config appsettings set `
    --name apelamay-int-api `
    --resource-group apelamay-int-rg `
    --settings `
        ASPNETCORE_ENVIRONMENT=Production `
        CloudinarySettings__CloudName=your-cloud-name `
        CloudinarySettings__ApiKey=your-api-key `
        CloudinarySettings__ApiSecret=your-api-secret `
        Resend__ApiToken=your-resend-token
```

Or use Azure Portal:
1. Go to Azure Portal → `apelamay-int-api`
2. **Configuration** → **Application settings**
3. Add settings:
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `CloudinarySettings__CloudName` = `[your-value]`
   - `CloudinarySettings__ApiKey` = `[your-value]`
   - `CloudinarySettings__ApiSecret` = `[your-value]`
   - `Resend__ApiToken` = `[your-value]`
4. Click **Save**

### Step 2: Configure BFF App Settings

```powershell
# Set BFF configuration
az webapp config appsettings set `
    --name apelamay-int-bff `
    --resource-group apelamay-int-rg `
    --settings `
        ASPNETCORE_ENVIRONMENT=Production `
        ApiUrl=https://apelamay-int-api.azurewebsites.net
```

### Step 3: Run Database Migrations

After API is deployed, run migrations:

**Option A: Using Azure Portal (Kudu)**
1. Go to `apelamay-int-api` → **Advanced Tools** → **Go**
2. Click **Debug console** → **CMD**
3. Navigate to `site\wwwroot`
4. Run: `dotnet API.dll --migrate`

**Option B: Using Local Connection**
```powershell
# Update connection string in appsettings.json to point to Azure SQL
# Then run migrations locally
cd API
dotnet ef database update
```

**Option C: Automated in Pipeline** (Advanced - see Part 7)

---

## Part 6: Set Up Continuous Deployment

### How It Works

With the pipelines configured:

1. **Push to main branch** triggers appropriate pipeline:
   ```powershell
   git add .
   git commit -m "Update API"
   git push origin main
   ```

2. **Pipeline automatically**:
   - Detects changes (based on paths)
   - Builds the application
   - Runs tests (if configured)
   - Deploys to Azure
   - Takes ~5-10 minutes

### Path Triggers

**API Pipeline** triggers on changes to:
- `API/**`
- `Application/**`
- `Domain/**`
- `Infrastructure/**`
- `Persistence/**`

**BFF Pipeline** triggers on changes to:
- `BFF/**`
- `client/**`

### Manual Triggers

To run pipeline manually:
1. Go to **Pipelines** → **Pipelines**
2. Select your pipeline (API or BFF)
3. Click **Run pipeline**
4. Select branch
5. Click **Run**

---

## Part 7: Advanced Configuration (Optional)

### A. Add Database Migration to API Pipeline

Update `azure-pipelines-api.yml` to add migration step:

```yaml
- stage: Deploy
  displayName: 'Deploy API'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: Deploy
    displayName: 'Deploy to Azure'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure App Service'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/api-drop/*.zip'
              deploymentMethod: 'auto'
          
          # Add migration step
          - task: AzureCLI@2
            displayName: 'Run Database Migrations'
            inputs:
              azureSubscription: '$(azureSubscription)'
              scriptType: 'ps'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Install EF Core tools
                dotnet tool install --global dotnet-ef
                
                # Get connection string
                $connectionString = az webapp config connection-string list `
                  --name $(webAppName) `
                  --resource-group apelamay-int-rg `
                  --query "[0].value" -o tsv
                
                # Run migrations
                cd $(Pipeline.Workspace)/api-drop
                dotnet ef database update --connection "$connectionString"
```

### B. Add Deployment Slots (Zero-Downtime)

Create a staging slot:

```powershell
# Create staging slot
az webapp deployment slot create `
    --name apelamay-int-api `
    --resource-group apelamay-int-rg `
    --slot staging

az webapp deployment slot create `
    --name apelamay-int-bff `
    --resource-group apelamay-int-rg `
    --slot staging
```

Update pipeline to use slots:

```yaml
- task: AzureWebApp@1
  displayName: 'Deploy to Staging Slot'
  inputs:
    azureSubscription: '$(azureSubscription)'
    appType: 'webApp'
    appName: '$(webAppName)'
    package: '$(Pipeline.Workspace)/api-drop/*.zip'
    deployToSlotOrASE: true
    resourceGroupName: 'apelamay-int-rg'
    slotName: 'staging'

- task: AzureAppServiceManage@0
  displayName: 'Swap Staging to Production'
  inputs:
    azureSubscription: '$(azureSubscription)'
    action: 'Swap Slots'
    webAppName: '$(webAppName)'
    resourceGroupName: 'apelamay-int-rg'
    sourceSlot: 'staging'
    targetSlot: 'production'
```

### C. Add Automated Tests

Add test stage before deployment:

```yaml
- stage: Test
  displayName: 'Run Tests'
  dependsOn: Build
  jobs:
  - job: Test
    steps:
    - task: DotNetCoreCLI@2
      displayName: 'Run Unit Tests'
      inputs:
        command: 'test'
        projects: '**/*Tests.csproj'
        arguments: '--configuration $(buildConfiguration)'
```

### D. Add Approval Gates

1. Go to **Pipelines** → **Environments**
2. Click on **production** environment
3. Click **⋮** (more options) → **Approvals and checks**
4. Click **+** → **Approvals**
5. Add approvers (your email)
6. Save

Now deployments will require manual approval before going to production.

---

## Part 8: Monitoring and Troubleshooting

### View Pipeline Runs

1. **Pipelines** → **Pipelines**
2. Click on your pipeline (API or BFF)
3. See all runs with status:
   - ✅ Green = Success
   - ❌ Red = Failed
   - 🔵 Blue = Running
   - ⚪ Canceled

### View Logs

Click on any run → Click on stage/job → View detailed logs

### Common Issues

#### Issue 1: "Service connection not found"
**Solution:**
```yaml
# Update in azure-pipelines-*.yml
variables:
  azureSubscription: 'Azure-Apelamay-Int'  # Must match service connection name exactly
```

#### Issue 2: ".NET 9.0 not found"
**Solution:**
```yaml
- task: UseDotNet@2
  inputs:
    version: '9.x'  # Use 9.x instead of 9.0.x
    includePreviewVersions: true
```

#### Issue 3: "npm install failed"
**Solution:**
Check Node version and update package.json
```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'  # Or '18.x' if using older packages
```

#### Issue 4: "Deployment timed out"
**Solution:**
Increase timeout or check App Service is running:
```powershell
az webapp show --name apelamay-int-api --resource-group apelamay-int-rg --query state
```

---

## Part 9: Deployment Checklist

### Pre-Deployment
- [ ] Infrastructure deployed to Azure
- [ ] Azure DevOps project created
- [ ] Service connection configured
- [ ] Code pushed to repository

### Pipeline Setup
- [ ] API pipeline created and tested
- [ ] BFF pipeline created and tested
- [ ] Pipelines trigger on correct paths
- [ ] Build artifacts are published

### Configuration
- [ ] API app settings configured
- [ ] BFF app settings configured
- [ ] Connection strings configured
- [ ] Database migrations run

### Post-Deployment
- [ ] API health check: https://apelamay-int-api.azurewebsites.net/api/health
- [ ] BFF accessible: https://apelamay-int-bff.azurewebsites.net
- [ ] Database connected (API can query data)
- [ ] Frontend loads and can call API

---

## Quick Reference

### Pipeline Commands

```powershell
# View pipeline runs
az pipelines runs list --organization https://dev.azure.com/{org} --project Apelamay

# Trigger pipeline manually
az pipelines run --organization https://dev.azure.com/{org} --project Apelamay --name "API-Pipeline"

# View pipeline details
az pipelines show --organization https://dev.azure.com/{org} --project Apelamay --name "API-Pipeline"
```

### App Service Commands

```powershell
# View API logs
az webapp log tail --name apelamay-int-api --resource-group apelamay-int-rg

# Restart app
az webapp restart --name apelamay-int-api --resource-group apelamay-int-rg

# View app settings
az webapp config appsettings list --name apelamay-int-api --resource-group apelamay-int-rg
```

---

## Summary

### What You've Set Up

1. ✅ **Azure DevOps Project** with Git repository
2. ✅ **Service Connection** to your Azure subscription
3. ✅ **API Pipeline** that:
   - Builds .NET 9.0 API
   - Deploys to `apelamay-int-api`
   - Triggers on API code changes
4. ✅ **BFF Pipeline** that:
   - Builds React frontend
   - Builds .NET 9.0 BFF
   - Combines them
   - Deploys to `apelamay-int-bff`
   - Triggers on BFF or client changes

### Workflow

```
Developer → Git Push → Azure DevOps Pipeline → Build → Deploy → Azure App Service
```

### Deployment Time

- **API**: ~5-7 minutes
- **BFF**: ~8-11 minutes (includes React build)

---

## Next Steps

1. **Test your deployment**:
   ```powershell
   # Make a small change to API
   # Commit and push
   git add .
   git commit -m "Test deployment"
   git push origin main
   
   # Watch pipeline in Azure DevOps
   ```

2. **Set up monitoring**:
   - Application Insights dashboards
   - Alerts for failures
   - Performance monitoring

3. **Add more environments**:
   - Development
   - Testing
   - Staging
   - Production

4. **Implement best practices**:
   - Automated tests
   - Code coverage
   - Security scanning
   - Deployment approvals

---

**Your CI/CD pipelines are ready!** Every push to main will automatically build and deploy your applications. 🚀
