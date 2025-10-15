# Azure DevOps Setup with GitHub Repository

## Overview
Since your code is already on GitHub, you can connect Azure DevOps pipelines directly to your GitHub repository. This is straightforward and gives you the best of both worlds!

---

## Prerequisites

✅ Your code is on GitHub (already done!)
✅ Azure subscription with resources deployed
✅ Azure DevOps account (will create project in existing organization)

---

## Part 1: Create Azure DevOps Project

### Step 1: Go to Your Existing Organization

1. Go to **https://dev.azure.com**
2. Sign in
3. Select your **existing organization** (you already have one)
4. Click **+ New project**

### Step 2: Create Project

Configure:
- **Project name**: `Apelamay`
- **Description**: Apelamay Application Deployment
- **Visibility**: Private
- **Version control**: Git (doesn't matter, we'll use GitHub)
- **Work item process**: Agile

Click **Create**

---

## Part 2: Create Service Connection to Azure

This connects Azure DevOps to your Azure subscription for deployments.

### Step 1: Create Azure Service Connection

1. In your project, click **Project settings** (bottom left)
2. Under **Pipelines**, click **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager** → **Next**
5. Select **Service principal (automatic)** → **Next**
6. Configure:
   - **Scope level**: Subscription
   - **Subscription**: Your Azure subscription
   - **Resource group**: `apelamay-int-rg`
   - **Service connection name**: `Azure-Apelamay-Int`
   - **Description**: Connection to apelamay-int Azure resources
   - ✅ Check **Grant access permission to all pipelines**
7. Click **Save**

---

## Part 3: Connect to GitHub

You'll create a service connection to GitHub so Azure Pipelines can access your repository.

### Step 1: Create GitHub Service Connection

1. Still in **Service connections**
2. Click **New service connection**
3. Select **GitHub** → **Next**
4. Choose **Grant authorization**
5. Click **Authorize Azure Pipelines**
6. Sign in to GitHub if prompted
7. Authorize the Azure Pipelines app
8. Configure:
   - **Service connection name**: `GitHub-Apelamay`
   - ✅ Check **Grant access permission to all pipelines**
9. Click **Save**

**Note**: This creates an OAuth connection between Azure DevOps and GitHub.

---

## Part 4: Create API Pipeline

### Step 1: Verify Your Pipeline File

Your repository should have `azure-pipelines-api.yml` with this content (already in your repo):

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
  azureSubscription: 'Azure-Apelamay-Int'
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
              appType: 'webApp'
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/api-drop/*.zip'
              deploymentMethod: 'auto'
```

### Step 2: Create API Pipeline in Azure DevOps

1. Go to **Pipelines** → **Pipelines**
2. Click **New pipeline**
3. **Where is your code?** → Select **GitHub**
4. You may be prompted to authorize again - click **Authorize**
5. Select your repository (e.g., `yourusername/apelamay`)
6. **Configure your pipeline** → Select **Existing Azure Pipelines YAML file**
7. Choose:
   - **Branch**: `main`
   - **Path**: `/azure-pipelines-api.yml`
8. Click **Continue**
9. Review the YAML
10. Click **Run**

### Step 3: Watch First Build

The pipeline will:
- ✅ Clone from GitHub
- ✅ Build .NET 9.0 API
- ✅ Create deployment package
- ✅ Deploy to Azure App Service
- ⏱️ Takes ~5-7 minutes

---

## Part 5: Create BFF Pipeline

### Step 1: Verify BFF Pipeline File

Your repository should have `azure-pipelines-bff.yml`:

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
  azureSubscription: 'Azure-Apelamay-Int'
  webAppName: 'apelamay-int-bff'

stages:
- stage: Build
  displayName: 'Build BFF and Client'
  jobs:
  - job: Build
    displayName: 'Build job'
    steps:
    - task: NodeTool@0
      displayName: 'Install Node.js'
      inputs:
        versionSpec: '20.x'

    - script: |
        cd client
        npm install
        npm run build
      displayName: 'Build React Client'

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
              appType: 'webApp'
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/bff-drop/*.zip'
              deploymentMethod: 'auto'
```

### Step 2: Create BFF Pipeline

1. Go to **Pipelines** → **Pipelines**
2. Click **New pipeline**
3. Select **GitHub**
4. Select your repository
5. Select **Existing Azure Pipelines YAML file**
6. Choose:
   - **Branch**: `main`
   - **Path**: `/azure-pipelines-bff.yml`
7. Click **Continue**
8. Click **Run**

---

## Part 6: Configure Pipelines (Optional)

### Rename Pipelines for Clarity

After creating both pipelines:

1. Go to **Pipelines** → **Pipelines**
2. Click on a pipeline
3. Click **⋮** (three dots) → **Rename/move**
4. Rename:
   - First pipeline → `API - Build and Deploy`
   - Second pipeline → `BFF - Build and Deploy`

### Set Up Build Status Badge (Optional)

Add build status badges to your GitHub README:

1. In Azure DevOps, go to pipeline
2. Click **⋮** → **Status badge**
3. Copy the Markdown
4. Add to your GitHub README.md:

```markdown
## Build Status

[![API Build](https://dev.azure.com/your-org/Apelamay/_apis/build/status/API?branchName=main)](https://dev.azure.com/your-org/Apelamay/_build/latest?definitionId=1&branchName=main)

[![BFF Build](https://dev.azure.com/your-org/Apelamay/_apis/build/status/BFF?branchName=main)](https://dev.azure.com/your-org/Apelamay/_build/latest?definitionId=2&branchName=main)
```

---

## Part 7: Configure App Settings

After first deployment, configure your Azure App Services:

### API Configuration

```powershell
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

### BFF Configuration

```powershell
az webapp config appsettings set `
    --name apelamay-int-bff `
    --resource-group apelamay-int-rg `
    --settings `
        ASPNETCORE_ENVIRONMENT=Production `
        ApiUrl=https://apelamay-int-api.azurewebsites.net
```

---

## Part 8: How It Works

### Continuous Integration/Deployment Flow

```
Developer makes changes
    ↓
Git commit + push to GitHub
    ↓
GitHub webhook notifies Azure DevOps
    ↓
Azure Pipeline automatically triggers
    ↓
Pipeline clones from GitHub
    ↓
Builds application
    ↓
Deploys to Azure App Service
    ↓
✅ Live on Azure!
```

### Automatic Triggers

**API Pipeline** triggers on push to `main` with changes in:
- `API/**`
- `Application/**`
- `Domain/**`
- `Infrastructure/**`
- `Persistence/**`

**BFF Pipeline** triggers on push to `main` with changes in:
- `BFF/**`
- `client/**`

### Manual Trigger

To trigger manually:
1. Go to **Pipelines**
2. Select pipeline
3. Click **Run pipeline**
4. Choose branch
5. Click **Run**

---

## Part 9: Workflow Example

### Making a Change

```powershell
# Make changes to API
cd c:\My_Stuff\development\apelamay\API
# Edit some code...

# Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# Pipeline automatically:
# ✅ Detects change in API folder
# ✅ Triggers API pipeline
# ✅ Builds and deploys
# ✅ Takes ~5-7 minutes
```

### View Pipeline Run

1. Push triggers webhook to Azure DevOps
2. Pipeline starts automatically
3. View in **Pipelines** → **Pipelines** → Click run
4. See real-time logs
5. Get email notification on completion

---

## Part 10: Advanced Features

### A. Set Up Branch Policies

Require pull requests before merging to main:

1. In Azure DevOps, go to **Repos** (even though using GitHub)
2. Or configure in GitHub:
   - Repository **Settings** → **Branches**
   - Add rule for `main` branch
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass

### B. Add Pre-Deployment Approvals

1. Go to **Pipelines** → **Environments**
2. Click **production**
3. Click **⋮** → **Approvals and checks**
4. Add **Approvals**
5. Add your email
6. Now deployments wait for manual approval

### C. Set Up Notifications

Get notified on build success/failure:

1. **Project settings** → **Notifications**
2. Click **New subscription**
3. Select **Build completed**
4. Configure:
   - Pipeline: Choose your pipeline
   - Status: Failed, Succeeded
   - Deliver to: Your email
5. Save

---

## Troubleshooting

### Issue 1: "GitHub connection failed"

**Solution:**
1. Go to **Project settings** → **Service connections**
2. Click on GitHub connection
3. Click **Verify**
4. Re-authorize if needed

### Issue 2: "Pipeline not triggering automatically"

**Solution:**
1. Check GitHub webhook is installed:
   - GitHub repo → **Settings** → **Webhooks**
   - Should see Azure Pipelines webhook
2. Check trigger paths in YAML
3. Ensure pipeline is not paused

### Issue 3: "Cannot access GitHub repository"

**Solution:**
1. Repository must not be archived
2. Azure Pipelines app must have access
3. Check repository permissions

### Issue 4: "Build failed: .NET 9.0 not found"

**Solution:**
Update pipeline YAML:
```yaml
- task: UseDotNet@2
  inputs:
    version: '9.x'  # Instead of 9.0.x
    includePreviewVersions: true
```

---

## Quick Reference

### Your Setup

| Component | Value |
|-----------|-------|
| **Code Repository** | GitHub |
| **CI/CD Platform** | Azure DevOps |
| **Deployment Target** | Azure App Services |
| **API Pipeline** | `azure-pipelines-api.yml` |
| **BFF Pipeline** | `azure-pipelines-bff.yml` |
| **Service Connection** | `Azure-Apelamay-Int` |

### URLs

```
Azure DevOps Project: https://dev.azure.com/{org}/Apelamay
GitHub Repository: https://github.com/{user}/apelamay
API Application: https://apelamay-int-api.azurewebsites.net
BFF Application: https://apelamay-int-bff.azurewebsites.net
```

### Commands

```powershell
# Trigger deployment (push to GitHub)
git push origin main

# View logs
# Go to Azure DevOps → Pipelines → Select run

# Restart app
az webapp restart --name apelamay-int-api --resource-group apelamay-int-rg

# View app logs
az webapp log tail --name apelamay-int-api --resource-group apelamay-int-rg
```

---

## Summary

### What You've Accomplished

✅ **Azure DevOps Project** created in existing organization
✅ **Service Connections** to both Azure and GitHub
✅ **API Pipeline** that builds and deploys .NET 9.0 API
✅ **BFF Pipeline** that builds React + .NET BFF
✅ **Automatic deployment** on push to GitHub
✅ **Working CI/CD** pipeline from GitHub to Azure

### Benefits of This Setup

- 🚀 **Code in GitHub** - Familiar Git workflow
- 🔄 **Build in Azure DevOps** - Enterprise CI/CD
- ☁️ **Deploy to Azure** - Scalable hosting
- 🤖 **Fully automated** - Push to deploy
- 📊 **Build history** - Track all deployments
- ✅ **Free tier** - No cost for private repos

### Deployment Time

- **API**: ~5-7 minutes
- **BFF**: ~8-11 minutes

---

## Next Steps

1. **Test the pipeline**:
   ```powershell
   # Make a small change
   git commit -m "Test pipeline" --allow-empty
   git push origin main
   # Watch in Azure DevOps
   ```

2. **Configure app settings** (Part 7)

3. **Run database migrations**

4. **Test your application**:
   - API: https://apelamay-int-api.azurewebsites.net
   - BFF: https://apelamay-int-bff.azurewebsites.net

5. **Set up monitoring** with Application Insights

---

**Your GitHub → Azure DevOps → Azure pipeline is ready!** 🎉

Every push to GitHub automatically deploys to Azure. No manual steps needed!
