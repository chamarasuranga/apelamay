# Quick Reference: Multi-Environment Setup

## 🚀 Deploy All Environments

```powershell
# Deploy INT
.\deploy-environment.ps1 -Environment int

# Deploy UAT
.\deploy-environment.ps1 -Environment uat

# Deploy PROD
.\deploy-environment.ps1 -Environment prod
```

## 📊 Resource Names

| Resource | INT | UAT | PROD |
|----------|-----|-----|------|
| API App | `apelamay-int-api` | `apelamay-uat-api` | `apelamay-prod-api` |
| BFF App | `apelamay-int-bff` | `apelamay-uat-bff` | `apelamay-prod-bff` |
| SQL Server | `apelamay-int-sql` | `apelamay-uat-sql` | `apelamay-prod-sql` |
| Database | `apelamay-int-db` | `apelamay-uat-db` | `apelamay-prod-db` |

## 🌐 Application URLs

| Environment | API | BFF (Frontend) |
|-------------|-----|----------------|
| **INT** | https://apelamay-int-api.azurewebsites.net | https://apelamay-int-bff.azurewebsites.net |
| **UAT** | https://apelamay-uat-api.azurewebsites.net | https://apelamay-uat-bff.azurewebsites.net |
| **PROD** | https://apelamay-prod-api.azurewebsites.net | https://apelamay-prod-bff.azurewebsites.net |

## 🔀 Git Branch Strategy

```
develop  →  Deploys to INT
uat      →  Deploys to UAT
main     →  Deploys to PROD
```

## 📝 Typical Workflow

```powershell
# 1. Develop in develop branch
git checkout develop
git commit -m "New feature"
git push  # Auto-deploys to INT

# 2. Promote to UAT for testing
git checkout uat
git merge develop
git push  # Auto-deploys to UAT

# 3. Release to PROD
git checkout main
git merge uat
git push  # Auto-deploys to PROD
```

## 🗄️ Connection Strings

Connection strings are **automatically configured** in each App Service.

View in Azure Portal:
```
App Service → Configuration → Connection strings → DefaultConnection
```

## 🔧 One-Time Setup

1. **Deploy infrastructure for each environment**
2. **Create Git branches** (develop, uat, main)
3. **Set up Azure DevOps pipeline** (one-time)
4. **Push to branches to deploy**

Done! 🎉
