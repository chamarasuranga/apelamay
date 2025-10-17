# Deployment Flow Summary

## 🚀 What Happens When You Push to Each Branch

### Push to `develop` Branch
```
┌─────────────────────────────────────┐
│  Build Stage                         │
│  ✅ Compile API                      │
│  ✅ Run Tests                        │
│  ✅ Create Artifact                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Deploy to INT                       │
│  Environment: INT                    │
│  ✅ Deploy to apelamay-int-api       │
│  ✅ Health Check                     │
│  Connection String: int-sql          │
└─────────────────────────────────────┘
```

### Push to `uat` Branch
```
┌─────────────────────────────────────┐
│  Build Stage                         │
│  ✅ Compile API                      │
│  ✅ Run Tests                        │
│  ✅ Create Artifact                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Deploy to UAT                       │
│  Environment: UAT                    │
│  ✅ Deploy to apelamay-uat-api       │
│  ✅ Health Check                     │
│  Connection String: uat-sql          │
└─────────────────────────────────────┘
```

### Push to `main` Branch ⭐ (Updated!)
```
┌─────────────────────────────────────┐
│  Build Stage                         │
│  ✅ Compile API                      │
│  ✅ Run Tests                        │
│  ✅ Create Artifact                  │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │  Parallel Deploy │
    └─────────────────┘
           ↙         ↘
┌───────────────────┐  ┌───────────────────┐
│  Deploy to INT    │  │  Deploy to PROD   │
│  Environment: INT │  │  Environment: PROD│
│  ✅ Deploy to     │  │  ✅ Deploy to     │
│     apelamay-int- │  │     apelamay-prod-│
│     api           │  │     api           │
│  ✅ Health Check  │  │  ✅ Health Check  │
│  Connection:      │  │  Connection:      │
│     int-sql       │  │     prod-sql      │
└───────────────────┘  └───────────────────┘
```

## 🎯 Why Deploy to INT from Main?

**Benefits:**
1. ✅ **Test Before PROD** - Validate the exact code that will go to production
2. ✅ **Smoke Testing** - Quick sanity check in INT environment
3. ✅ **Hotfix Testing** - Test urgent fixes in INT first
4. ✅ **Rollback Validation** - Test rollback procedures

## 📊 Environment Isolation

Each environment has its own:
- **SQL Database** with separate connection string
- **App Service** with isolated configuration
- **Application Insights** for independent monitoring

## 🔒 Connection String Management

| Environment | SQL Server | Database | Configured By |
|-------------|-----------|----------|---------------|
| INT | `apelamay-int-sql` | `apelamay-int-db` | ARM Template |
| UAT | `apelamay-uat-sql` | `apelamay-uat-db` | ARM Template |
| PROD | `apelamay-prod-sql` | `apelamay-prod-db` | ARM Template |

Connection strings are:
- ✅ Stored securely in Azure App Service Configuration
- ✅ Never in source code
- ✅ Automatically injected at runtime
- ✅ Environment-specific

## 🎬 Typical Workflow

### Scenario 1: New Feature Development
```
1. Create feature branch from develop
2. Develop and commit changes
3. Merge to develop → Auto-deploys to INT
4. Test in INT: https://apelamay-int-bff.azurewebsites.net
5. Merge develop to uat → Auto-deploys to UAT
6. UAT testing and sign-off
7. Merge uat to main → Auto-deploys to INT + PROD
8. Verify in INT, then verify in PROD
```

### Scenario 2: Hotfix
```
1. Create hotfix branch from main
2. Fix critical bug
3. Merge to main → Auto-deploys to INT + PROD
4. Quickly verify in INT
5. Monitor PROD deployment
6. Backport to develop and uat branches
```

### Scenario 3: Testing in INT Only
```
1. Checkout develop branch
2. Make experimental changes
3. Push to develop → Deploys to INT only
4. Test without affecting UAT or PROD
```

## 🚦 Pipeline Stage Flow

### All Branches:
```yaml
Stage: Build
├── Restore dependencies
├── Compile code
├── Run unit tests
├── Create deployment package
└── Publish artifact
```

### Branch: develop
```yaml
Stage: DeployINT
├── Download artifact
├── Deploy to apelamay-int-api
└── Health check
```

### Branch: uat
```yaml
Stage: DeployUAT
├── Download artifact
├── Deploy to apelamay-uat-api
└── Health check
```

### Branch: main
```yaml
Stage: DeployINT (runs first)
├── Download artifact
├── Deploy to apelamay-int-api
└── Health check

Stage: DeployPROD (runs in parallel)
├── Download artifact
├── Deploy to apelamay-prod-api
└── Health check
```

## 📝 Quick Commands

### Deploy Infrastructure
```powershell
# Deploy INT
.\deploy-environment.ps1 -Environment int

# Deploy UAT
.\deploy-environment.ps1 -Environment uat

# Deploy PROD
.\deploy-environment.ps1 -Environment prod
```

### Switch Branches
```powershell
# Deploy to INT only
git checkout develop
git push

# Deploy to UAT only
git checkout uat
git push

# Deploy to INT + PROD
git checkout main
git push
```

### Check Deployment Status
```powershell
# Azure DevOps
# Pipelines → API - Deploy → Recent runs
# Click on run to see which environments deployed
```

## ✅ Summary

| Branch | INT | UAT | PROD |
|--------|-----|-----|------|
| `develop` | ✅ | ❌ | ❌ |
| `uat` | ❌ | ✅ | ❌ |
| `main` | ✅ | ❌ | ✅ |

**Key Points:**
- 🎯 INT gets deployed from both `develop` and `main`
- 🔒 Each environment has isolated SQL database
- 🚀 Deployments are automatic on push
- ✅ Health checks verify successful deployment
- 📊 Monitor each environment independently
