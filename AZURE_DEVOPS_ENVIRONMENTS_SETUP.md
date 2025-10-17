# Azure DevOps Environments Setup Guide

## Overview

Your pipeline is configured to deploy to **3 separate environments**:
- **INT** (Integration) - Deploys from `develop` branch
- **UAT** (User Acceptance Testing) - Deploys from `uat` branch  
- **Production** - Deploys from `main` branch

Each environment has:
- ✅ Separate Azure resources (App Services, SQL Databases)
- ✅ Separate connection strings
- ✅ Deployment history tracking
- ✅ Optional approval gates
- ✅ Environment-specific variables

---

## Step 1: Create Environments in Azure DevOps

### 1.1 Go to Environments
1. Open your Azure DevOps project
2. Navigate to **Pipelines** → **Environments**
3. Click **"New environment"**

### 1.2 Create INT Environment
- **Name**: `INT`
- **Description**: Integration environment (deployed from develop branch)
- **Resources**: None (leave empty)
- Click **Create**

### 1.3 Create UAT Environment
- **Name**: `UAT`
- **Description**: User Acceptance Testing environment (deployed from uat branch)
- **Resources**: None (leave empty)
- Click **Create**

### 1.4 Create Production Environment
- **Name**: `Production`
- **Description**: Production environment (deployed from main branch)
- **Resources**: None (leave empty)
- Click **Create**

---

## Step 2: Configure Approval Gates (Optional but Recommended)

### For Production Environment:
1. Click on **Production** environment
2. Click the **⋮** menu → **Approvals and checks**
3. Click **"+"** → **Approvals**
4. Add approvers (your email or team)
5. **Settings**:
   - ✅ **Timeout**: 30 days
   - ✅ **Allow pipeline run approvers**: Unchecked
   - ✅ **Instructions**: "Review deployment to Production before approving"
6. Click **Create**

### For UAT Environment (Optional):
- Same steps as Production
- Add different approvers if needed

### For INT Environment:
- Usually no approval needed (auto-deploy)
- Can add if you want manual control

---

## Step 3: Deploy Infrastructure for Each Environment

Run the deployment script for each environment:

### Deploy INT Environment:
```powershell
.\deploy-environment.ps1 -Environment int
```

This creates:
- Resource Group: `apelamay-int-rg`
- API App: `apelamay-int-api`
- BFF App: `apelamay-int-bff`
- SQL Server: `apelamay-int-sql`
- Database: `apelamay-int-db`

### Deploy UAT Environment:
```powershell
.\deploy-environment.ps1 -Environment uat
```

This creates:
- Resource Group: `apelamay-uat-rg`
- API App: `apelamay-uat-api`
- BFF App: `apelamay-uat-bff`
- SQL Server: `apelamay-uat-sql`
- Database: `apelamay-uat-db`

### Deploy PROD Environment:
```powershell
.\deploy-environment.ps1 -Environment prod
```

This creates:
- Resource Group: `apelamay-prod-rg`
- API App: `apelamay-prod-api`
- BFF App: `apelamay-prod-bff`
- SQL Server: `apelamay-prod-sql`
- Database: `apelamay-prod-db`

**Note**: You'll be prompted for SQL password for each environment. Use different passwords for each!

---

## Step 4: Set Up Git Branches

Create the required branches in your repository:

```powershell
# Create develop branch (for INT)
git checkout -b develop
git push -u origin develop

# Create uat branch (for UAT)
git checkout -b uat
git push -u origin uat

# Main branch already exists (for PROD)
```

---

## Step 5: Configure Service Connection

Your pipeline uses the service connection: `Azure-Apelamay-Int`

### Ensure it has access to all resource groups:
1. Go to **Project Settings** → **Service connections**
2. Click on **Azure-Apelamay-Int**
3. Click **"Manage Service Principal"**
4. Ensure the service principal has **Contributor** role on:
   - `apelamay-int-rg`
   - `apelamay-uat-rg`
   - `apelamay-prod-rg`

---

## Step 6: How Deployments Work

### Deployment Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                     Git Repository                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  develop branch  →  Triggers Pipeline  →  Deploy to INT    │
│                                           (no approval)     │
│                                                             │
│  uat branch      →  Triggers Pipeline  →  Deploy to UAT    │
│                                           (optional approval)│
│                                                             │
│  main branch     →  Triggers Pipeline  →  Deploy to PROD   │
│                                           (requires approval)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Stages:

1. **Build Stage** (Always runs)
   - Restore dependencies
   - Build API
   - Run tests
   - Publish artifacts

2. **Deploy to INT** (Runs if `develop` branch)
   - Downloads artifact
   - Deploys to `apelamay-int-api`
   - Health check

3. **Deploy to UAT** (Runs if `uat` branch)
   - Downloads artifact
   - Deploys to `apelamay-uat-api`
   - Health check

4. **Deploy to PROD** (Runs if `main` branch)
   - **Waits for approval** (if configured)
   - Downloads artifact
   - Deploys to `apelamay-prod-api`
   - Health check

---

## Step 7: Test the Pipeline

### Deploy to INT:
```powershell
# Switch to develop branch
git checkout develop

# Make a change
echo "# INT deployment test" >> README.md

# Commit and push
git add .
git commit -m "Test INT deployment"
git push

# Pipeline will auto-deploy to INT environment
```

### Deploy to UAT:
```powershell
# Switch to uat branch
git checkout uat

# Merge from develop
git merge develop

# Push
git push

# Pipeline will auto-deploy to UAT environment
```

### Deploy to PROD:
```powershell
# Switch to main branch
git checkout main

# Merge from uat (or develop)
git merge uat

# Push
git push

# Pipeline will wait for approval, then deploy to PROD
```

---

## Step 8: View Deployment History

### In Azure DevOps:
1. Go to **Pipelines** → **Environments**
2. Click on any environment (INT, UAT, or Production)
3. You'll see:
   - ✅ Deployment history
   - ✅ Who deployed
   - ✅ When it was deployed
   - ✅ Which pipeline run
   - ✅ Approval history (for PROD)

---

## Connection String Management

Each environment automatically gets its own connection string:

### INT Environment:
```
Server=apelamay-int-sql.database.windows.net
Database=apelamay-int-db
```

### UAT Environment:
```
Server=apelamay-uat-sql.database.windows.net
Database=apelamay-uat-db
```

### PROD Environment:
```
Server=apelamay-prod-sql.database.windows.net
Database=apelamay-prod-db
```

Connection strings are **automatically injected** by the ARM template during infrastructure deployment. No manual configuration needed!

---

## Environment URLs

After deployment, your environments will be accessible at:

| Environment | API URL | BFF URL |
|-------------|---------|---------|
| **INT** | `https://apelamay-int-api.azurewebsites.net` | `https://apelamay-int-bff.azurewebsites.net` |
| **UAT** | `https://apelamay-uat-api.azurewebsites.net` | `https://apelamay-uat-bff.azurewebsites.net` |
| **PROD** | `https://apelamay-prod-api.azurewebsites.net` | `https://apelamay-prod-bff.azurewebsites.net` |

---

## Troubleshooting

### Environment not showing in Azure DevOps?
- Create it manually: **Pipelines** → **Environments** → **New environment**

### Approval not working?
- Check **Approvals and checks** on the environment
- Ensure approvers have correct permissions

### Wrong environment deployed?
- Check which branch you're pushing to
- Verify pipeline condition: `eq(variables['Build.SourceBranch'], 'refs/heads/XXX')`

### Connection string not set?
- Verify ARM template deployment succeeded
- Check App Service → Configuration → Connection strings in Azure Portal

---

## Best Practices

1. **Use different SQL passwords** for each environment
2. **Configure approvals** for UAT and PROD
3. **Test in INT** before promoting to UAT
4. **Test in UAT** before promoting to PROD
5. **Never push directly to main** - use pull requests
6. **Run database migrations** after deployment
7. **Monitor Application Insights** for each environment

---

## Quick Reference Commands

```powershell
# Deploy all infrastructure
.\deploy-environment.ps1 -Environment int
.\deploy-environment.ps1 -Environment uat
.\deploy-environment.ps1 -Environment prod

# Work with branches
git checkout develop    # Work on INT
git checkout uat        # Work on UAT
git checkout main       # Work on PROD

# Promote changes
git checkout uat && git merge develop && git push
git checkout main && git merge uat && git push
```

---

## Summary

You now have a complete **multi-environment CI/CD pipeline** with:
- ✅ 3 isolated environments (INT, UAT, PROD)
- ✅ Separate Azure resources and databases
- ✅ Branch-based deployment strategy
- ✅ Approval gates for production
- ✅ Deployment history tracking
- ✅ Automated health checks

**Next**: Deploy your infrastructure and push to branches to test! 🚀
