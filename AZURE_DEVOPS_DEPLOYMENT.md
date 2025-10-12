# 🚀 Azure DevOps Deployment Guide

## Architecture Overview
```
Azure DevOps Pipeline
   ↓
Build & Test
   ↓
┌──────────────────────────────┐
│  Deploy to Azure             │
│  ├─ API → App Service 1      │
│  └─ BFF + SPA → App Service 2│
└──────────────────────────────┘
```

## Prerequisites

1. **Azure DevOps Account** - [Sign up for free](https://dev.azure.com/)
2. **Azure Subscription** - Connected to Azure DevOps
3. **Git Repository** - Code pushed to Azure Repos or GitHub
4. **Azure Resources** - App Services created (see below)

---

## Part 1: Create Azure Resources

### 1.1 Create Resources via Azure Portal or CLI

```powershell
## 1. Create resources
az group create --name reactivities-rg --location eastus
az appservice plan create --name reactivities-plan --resource-group reactivities-rg --sku B1 
az webapp create --name reactivities-api --resource-group reactivities-rg --plan reactivities-plan --runtime "DOTNET:9"
az webapp create --name reactivities-bff --resource-group reactivities-rg --plan reactivities-plan --runtime "DOTNET:9"n to Azure
az login

# Create Resource Group
az group create --name reactivities-rg --location eastus

# Create App Service Plan
az appservice plan create `
  --name reactivities-plan `
  --resource-group reactivities-rg `
  --sku B1 `
  

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

# Enable HTTPS Only
az webapp update --resource-group reactivities-rg --name reactivities-api --https-only true
az webapp update --resource-group reactivities-rg --name reactivities-bff --https-only true
```

### 1.2 Configure App Service Settings

**API App Settings:**
```powershell
az webapp config appsettings set `
  --resource-group reactivities-rg `
  --name reactivities-api `
  --settings `
    ASPNETCORE_ENVIRONMENT="Production" `
    "ConnectionStrings__DefaultConnection=YOUR_CONNECTION_STRING" `
    "CloudinarySettings__CloudName=YOUR_CLOUDINARY_NAME" `
    "CloudinarySettings__ApiKey=YOUR_CLOUDINARY_KEY" `
    "CloudinarySettings__ApiSecret=YOUR_CLOUDINARY_SECRET"
```

**BFF App Settings:**
```powershell
az webapp config appsettings set `
  --resource-group reactivities-rg `
  --name reactivities-bff `
  --settings `
    ASPNETCORE_ENVIRONMENT="Production" `
    "ApiUrl=https://reactivities-api.azurewebsites.net"
```

---

## Part 2: Azure DevOps Setup

### 2.1 Create Azure DevOps Project

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Click **New Project**
3. Name: `Reactivities`
4. Visibility: Private
5. Click **Create**

### 2.2 Connect to Azure Subscription

1. Go to **Project Settings** (bottom left)
2. Click **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager**
5. Choose **Service principal (automatic)**
6. Select your **Subscription** and **Resource Group**
7. Name it: `AzureServiceConnection`
8. Check **Grant access permission to all pipelines**
9. Click **Save**

### 2.3 Push Code to Azure Repos

```powershell
# From your solution root
git remote add azure https://dev.azure.com/{your-org}/Reactivities/_git/Reactivities
git push azure main
```

Or use GitHub as your repository source.

---

## Part 3: Create Pipeline Files

### 3.1 Create Multi-Stage Pipeline

Create `azure-pipelines.yml` in your solution root:

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  apiAppName: 'reactivities-api'
  bffAppName: 'reactivities-bff'
  azureSubscription: 'AzureServiceConnection'

stages:
  # ========================================
  # STAGE 1: BUILD
  # ========================================
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      # Build API
      - job: BuildAPI
        displayName: 'Build API'
        steps:
          - task: UseDotNet@2
            displayName: 'Use .NET 9.0'
            inputs:
              version: '9.0.x'

          - task: DotNetCoreCLI@2
            displayName: 'Restore API'
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
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)/api --no-build'
              zipAfterPublish: true

          - task: PublishPipelineArtifact@1
            displayName: 'Publish API Artifact'
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)/api'
              artifactName: 'api-artifact'

      # Build BFF with React
      - job: BuildBFF
        displayName: 'Build BFF with React'
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: '18.x'

          - script: |
              cd client
              npm install
              npm run build
            displayName: 'Build React App'

          - task: UseDotNet@2
            displayName: 'Use .NET 9.0'
            inputs:
              version: '9.0.x'

          - task: DotNetCoreCLI@2
            displayName: 'Restore BFF'
            inputs:
              command: 'restore'
              projects: 'BFF/BFF.csproj'

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
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)/bff --no-build'
              zipAfterPublish: true

          - task: PublishPipelineArtifact@1
            displayName: 'Publish BFF Artifact'
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)/bff'
              artifactName: 'bff-artifact'

  # ========================================
  # STAGE 2: DEPLOY TO DEV/STAGING
  # ========================================
  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: Build
    condition: succeeded()
    jobs:
      # Deploy API to Staging
      - deployment: DeployAPIStaging
        displayName: 'Deploy API to Staging'
        environment: 'Staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadPipelineArtifact@2
                  inputs:
                    artifactName: 'api-artifact'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  displayName: 'Deploy API to Azure'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'webApp'
                    appName: '$(apiAppName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
                    deploymentMethod: 'zipDeploy'

      # Deploy BFF to Staging
      - deployment: DeployBFFStaging
        displayName: 'Deploy BFF to Staging'
        environment: 'Staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadPipelineArtifact@2
                  inputs:
                    artifactName: 'bff-artifact'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  displayName: 'Deploy BFF to Azure'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'webApp'
                    appName: '$(bffAppName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
                    deploymentMethod: 'zipDeploy'

  # ========================================
  # STAGE 3: DEPLOY TO PRODUCTION
  # ========================================
  - stage: DeployProduction
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      # Deploy API to Production
      - deployment: DeployAPIProduction
        displayName: 'Deploy API to Production'
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadPipelineArtifact@2
                  inputs:
                    artifactName: 'api-artifact'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  displayName: 'Deploy API to Azure'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'webApp'
                    appName: '$(apiAppName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
                    deploymentMethod: 'zipDeploy'

      # Deploy BFF to Production
      - deployment: DeployBFFProduction
        displayName: 'Deploy BFF to Production'
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadPipelineArtifact@2
                  inputs:
                    artifactName: 'bff-artifact'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  displayName: 'Deploy BFF to Azure'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'webApp'
                    appName: '$(bffAppName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
                    deploymentMethod: 'zipDeploy'
```

---

## Part 4: Configure Pipeline Variables

### 4.1 Create Variable Groups

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `Reactivities-Common`
4. Add variables:
   - `apiAppName`: `reactivities-api`
   - `bffAppName`: `reactivities-bff`
   - `azureSubscription`: `AzureServiceConnection`

### 4.2 Create Environment-Specific Variables

**For Staging:**
1. Create group: `Reactivities-Staging`
2. Variables:
   - `ApiUrl`: `https://reactivities-api-staging.azurewebsites.net`
   - `Environment`: `Staging`

**For Production:**
1. Create group: `Reactivities-Production`
2. Variables:
   - `ApiUrl`: `https://reactivities-api.azurewebsites.net`
   - `Environment`: `Production`

### 4.3 Add Secret Variables

1. Go to variable group
2. Click **+ Add**
3. Add sensitive data (mark as secret):
   - `ConnectionString`: Your database connection string
   - `CloudinaryApiKey`: Your Cloudinary key
   - `CloudinaryApiSecret`: Your Cloudinary secret
   - `ResendApiToken`: Your email service token

---

## Part 5: Create Environments with Approvals

### 5.1 Create Environments

1. Go to **Pipelines** → **Environments**
2. Click **New environment**
3. Name: `Staging`
4. Click **Create**
5. Repeat for `Production`

### 5.2 Add Approval Gates (Production)

1. Click **Production** environment
2. Click **︙** (three dots) → **Approvals and checks**
3. Click **+** → **Approvals**
4. Add approvers (your email or team)
5. Click **Create**

---

## Part 6: Create and Run Pipeline

### 6.1 Create Pipeline in Azure DevOps

1. Go to **Pipelines** → **Pipelines**
2. Click **New Pipeline**
3. Select **Azure Repos Git** (or GitHub)
4. Select your repository
5. Select **Existing Azure Pipelines YAML file**
6. Select `/azure-pipelines.yml`
7. Click **Run**

### 6.2 Monitor Pipeline Execution

1. Watch the pipeline run
2. Stages will execute in order:
   - ✅ Build
   - ✅ Deploy to Staging (automatic)
   - ⏸️ Deploy to Production (requires approval)

---

## Part 7: Alternative - Separate Pipelines

If you prefer separate pipelines for API and BFF:

### 7.1 API Pipeline (`azure-pipelines-api.yml`)

```yaml
# azure-pipelines-api.yml
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
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'reactivities-api'

stages:
  - stage: Build
    jobs:
      - job: BuildAPI
        steps:
          - task: UseDotNet@2
            inputs:
              version: '9.0.x'

          - task: DotNetCoreCLI@2
            displayName: 'Restore'
            inputs:
              command: 'restore'
              projects: 'API/API.csproj'

          - task: DotNetCoreCLI@2
            displayName: 'Build'
            inputs:
              command: 'build'
              projects: 'API/API.csproj'
              arguments: '--configuration $(buildConfiguration)'

          - task: DotNetCoreCLI@2
            displayName: 'Run Tests'
            inputs:
              command: 'test'
              projects: '**/*Tests.csproj'
              arguments: '--configuration $(buildConfiguration) --no-build'

          - task: DotNetCoreCLI@2
            displayName: 'Publish'
            inputs:
              command: 'publish'
              publishWebProjects: false
              projects: 'API/API.csproj'
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
              zipAfterPublish: true

          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'api-drop'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployAPI
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureServiceConnection'
                    appType: 'webApp'
                    appName: '$(appName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
```

### 7.2 BFF Pipeline (`azure-pipelines-bff.yml`)

```yaml
# azure-pipelines-bff.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - BFF/**
      - client/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  appName: 'reactivities-bff'

stages:
  - stage: Build
    jobs:
      - job: BuildBFF
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: '18.x'

          - script: |
              cd client
              npm ci
              npm run build
            displayName: 'Build React App'

          - task: UseDotNet@2
            inputs:
              version: '9.0.x'

          - task: DotNetCoreCLI@2
            displayName: 'Restore BFF'
            inputs:
              command: 'restore'
              projects: 'BFF/BFF.csproj'

          - task: DotNetCoreCLI@2
            displayName: 'Build BFF'
            inputs:
              command: 'build'
              projects: 'BFF/BFF.csproj'
              arguments: '--configuration $(buildConfiguration)'

          - task: DotNetCoreCLI@2
            displayName: 'Publish BFF'
            inputs:
              command: 'publish'
              publishWebProjects: false
              projects: 'BFF/BFF.csproj'
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
              zipAfterPublish: true

          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'bff-drop'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployBFF
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureServiceConnection'
                    appType: 'webApp'
                    appName: '$(appName)'
                    package: '$(Pipeline.Workspace)/**/*.zip'
```

---

## Part 8: Advanced Configuration

### 8.1 Add Database Migration Step

Add to your API deployment:

```yaml
- task: AzureCLI@2
  displayName: 'Run EF Migrations'
  inputs:
    azureSubscription: 'AzureServiceConnection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      dotnet tool install --global dotnet-ef
      dotnet ef database update --project API/API.csproj --connection "$(ConnectionString)"
```

### 8.2 Add Smoke Tests

```yaml
- task: PowerShell@2
  displayName: 'Smoke Test'
  inputs:
    targetType: 'inline'
    script: |
      $response = Invoke-WebRequest -Uri "https://$(appName).azurewebsites.net/api/health" -UseBasicParsing
      if ($response.StatusCode -ne 200) {
        Write-Error "Health check failed!"
        exit 1
      }
```

### 8.3 Add Slot Deployment (Blue-Green)

```yaml
- task: AzureWebApp@1
  inputs:
    azureSubscription: 'AzureServiceConnection'
    appType: 'webApp'
    appName: '$(appName)'
    deployToSlotOrASE: true
    slotName: 'staging'
    package: '$(Pipeline.Workspace)/**/*.zip'

- task: AzureAppServiceManage@0
  displayName: 'Swap Slots'
  inputs:
    azureSubscription: 'AzureServiceConnection'
    action: 'Swap Slots'
    webAppName: '$(appName)'
    sourceSlot: 'staging'
    targetSlot: 'production'
```

---

## Part 9: Monitoring and Notifications

### 9.1 Add Slack/Teams Notifications

1. Go to **Project Settings** → **Service hooks**
2. Click **+** → Select **Slack** or **Microsoft Teams**
3. Configure webhook for pipeline events

### 9.2 Enable Application Insights

Add to your appsettings:

```json
{
  "ApplicationInsights": {
    "InstrumentationKey": "YOUR_KEY"
  }
}
```

---

## Part 10: Quick Start Commands

```powershell
# 1. Create resources
az group create --name reactivities-rg --location eastus
az appservice plan create --name reactivities-plan --resource-group reactivities-rg --sku B1 
az webapp create --name reactivities-api --resource-group reactivities-rg --plan reactivities-plan --runtime "DOTNET:9"
az webapp create --name reactivities-bff --resource-group reactivities-rg --plan reactivities-plan --runtime "DOTNET:9"

# 2. Commit pipeline file
git add azure-pipelines.yml
git commit -m "Add Azure DevOps pipeline"
git push

# 3. Create pipeline in Azure DevOps UI
# Navigate to Pipelines → New Pipeline → Select azure-pipelines.yml

# 4. Run pipeline
# Click "Run pipeline"
```

---

## Summary

✅ **Automated Build**: Compiles API, BFF, and React app  
✅ **Multi-Stage Deployment**: Staging → Production with approvals  
✅ **Artifact Management**: Separate artifacts for API and BFF  
✅ **Environment Configuration**: Variable groups for different environments  
✅ **Security**: Secrets stored in Azure DevOps variables  
✅ **Monitoring**: Integration with Application Insights  
✅ **Rollback**: Easy rollback through Azure Portal  

Your Azure DevOps pipeline is now configured for continuous deployment! 🎉

**URLs:**
- **BFF (Frontend)**: https://reactivities-bff.azurewebsites.net
- **API (Backend)**: https://reactivities-api.azurewebsites.net
- **Azure DevOps**: https://dev.azure.com/{your-org}/Reactivities
