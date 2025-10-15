# ARM Template Parameter Refactoring - Summary

## Overview
Refactored the ARM template to use a single `prefix` parameter that generates all resource names consistently, including the database name as `{prefix}-db`.

## Changes Made

### 1. ARM Template Parameter (`azure-deploy.json`)

**Before:**
```json
"parameters": {
  "appNamePrefix": {
    "type": "string",
    "defaultValue": "reactivities",
    "metadata": {
      "description": "Prefix for all resource names. Make it unique."
    }
  },
  "databaseName": {
    "type": "string",
    "defaultValue": "reactivitiesdb",
    "metadata": {
      "description": "The name of the SQL Database."
    }
  }
}
```

**After:**
```json
"parameters": {
  "prefix": {
    "type": "string",
    "defaultValue": "apelamay-int",
    "metadata": {
      "description": "Prefix for all resource names. Make it unique."
    }
  }
  // No separate databaseName parameter
}
```

### 2. Variables Section

**Updated to use `prefix` parameter:**

```json
"variables": {
  "appServicePlanName": "[concat(parameters('prefix'), '-plan')]",
  "apiAppName": "[concat(parameters('prefix'), '-api')]",
  "bffAppName": "[concat(parameters('prefix'), '-bff')]",
  "sqlServerName": "[concat(parameters('prefix'), '-sql')]",
  "databaseName": "[concat(parameters('prefix'), '-db')]",      // ✅ NEW: Generated from prefix
  "applicationInsightsName": "[concat(parameters('prefix'), '-insights')]",
  "apiUrl": "[concat('https://', variables('apiAppName'), '.azurewebsites.net')]",
  "bffUrl": "[concat('https://', variables('bffAppName'), '.azurewebsites.net')]"
}
```

### 3. Database Resource

**Updated to use the generated database name:**

```json
{
  "type": "databases",
  "apiVersion": "2022-11-01-preview",
  "name": "[variables('databaseName')]",  // ✅ Uses generated name
  "location": "[parameters('location')]",
  // ...rest of configuration
}
```

### 4. Connection String

**Updated to reference the variable:**

```json
"connectionStrings": [
  {
    "name": "DefaultConnection",
    "connectionString": "[concat('Server=tcp:', reference(resourceId('Microsoft.Sql/servers', variables('sqlServerName'))).fullyQualifiedDomainName, ',1433;Initial Catalog=', variables('databaseName'), ';Persist Security Info=False;User ID=', parameters('sqlAdministratorLogin'), ';Password=', parameters('sqlAdministratorPassword'), ';MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;')]",
    "type": "SQLAzure"
  }
]
```

### 5. Output

**Updated to output the generated database name:**

```json
"databaseName": {
  "type": "string",
  "value": "[variables('databaseName')]"  // ✅ Returns generated name
}
```

### 6. Deployment Script (`deploy-infrastructure-cli.ps1`)

**Parameter renamed:**

```powershell
param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "apelamay-int-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "australiasoutheast",
    
    [Parameter(Mandatory=$false)]
    [string]$Prefix = "apelamay-int",  // ✅ Changed from AppNamePrefix
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$SqlAdminPassword
)
```

**Deployment command updated:**

```powershell
$result = az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --template-file azure-deploy.json `
    --parameters prefix=$Prefix `  // ✅ Changed parameter name
    --parameters location=$Location `
    --parameters appServicePlanSku=$AppServicePlanSku `
    --parameters sqlAdministratorPassword=$PlainPassword `
    --output json | ConvertFrom-Json
```

## Resource Naming Convention

With the prefix `apelamay-int`, all resources will be named as:

| Resource Type | Resource Name | Generated From |
|---------------|---------------|----------------|
| Resource Group | `apelamay-int-rg` | Manual (script parameter) |
| App Service Plan | `apelamay-int-plan` | `{prefix}-plan` |
| API App Service | `apelamay-int-api` | `{prefix}-api` |
| BFF App Service | `apelamay-int-bff` | `{prefix}-bff` |
| SQL Server | `apelamay-int-sql` | `{prefix}-sql` |
| **SQL Database** | **`apelamay-int-db`** | **`{prefix}-db`** ✅ |
| Application Insights | `apelamay-int-insights` | `{prefix}-insights` |

### Full Qualified Domain Names (FQDNs)

| Resource | FQDN |
|----------|------|
| SQL Server | `apelamay-int-sql.database.windows.net` |
| API App | `apelamay-int-api.azurewebsites.net` |
| BFF App | `apelamay-int-bff.azurewebsites.net` |

## Benefits of This Approach

### 1. **Consistency**
- All resource names follow the same pattern: `{prefix}-{type}`
- Easy to identify related resources
- Predictable naming for automation

### 2. **Simplicity**
- Single parameter to control all resource names
- No need to specify database name separately
- Fewer parameters = fewer chances for mistakes

### 3. **Flexibility**
- Easy to deploy multiple environments with different prefixes:
  - `apelamay-dev` for development
  - `apelamay-test` for testing
  - `apelamay-prod` for production

### 4. **Best Practices**
- Follows Azure naming conventions
- Resource names are descriptive and consistent
- Easy to filter resources in Azure Portal

## How to Deploy

### Default Deployment (uses prefix "apelamay-int")

```powershell
.\deploy-infrastructure-cli.ps1
```

This will create:
- SQL Server: `apelamay-int-sql`
- Database: `apelamay-int-db` ✅
- API App: `apelamay-int-api`
- BFF App: `apelamay-int-bff`
- etc.

### Custom Prefix Deployment

```powershell
# For development environment
.\deploy-infrastructure-cli.ps1 -Prefix "apelamay-dev"

# This creates:
# - SQL Server: apelamay-dev-sql
# - Database: apelamay-dev-db ✅
# - API App: apelamay-dev-api
# - BFF App: apelamay-dev-bff
# - etc.
```

### Multiple Environments Example

```powershell
# Development
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-dev-rg" `
    -Prefix "apelamay-dev" `
    -Location "australiasoutheast" `
    -AppServicePlanSku "F1"

# Testing
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-test-rg" `
    -Prefix "apelamay-test" `
    -Location "australiasoutheast" `
    -AppServicePlanSku "B1"

# Production
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-prod-rg" `
    -Prefix "apelamay-prod" `
    -Location "australiasoutheast" `
    -AppServicePlanSku "S1"
```

## Connection String

The connection string will automatically use the generated database name:

```
Server=tcp:apelamay-int-sql.database.windows.net,1433;
Initial Catalog=apelamay-int-db;
Persist Security Info=False;
User ID=sqladmin;
Password={your-password};
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

## Deployment Output

After successful deployment, you'll see:

```
✅ DEPLOYMENT SUCCESSFUL!

🌐 Application URLs:
   BFF (Frontend): https://apelamay-int-bff.azurewebsites.net
   API (Backend): https://apelamay-int-api.azurewebsites.net

🗄️ Database:
   SQL Server: apelamay-int-sql.database.windows.net
   Database: apelamay-int-db  ✅

📊 Monitoring:
   Application Insights Key: [your-key]
```

## Parameter Validation

The `prefix` parameter should:
- ✅ Be lowercase
- ✅ Use hyphens (not underscores)
- ✅ Be 3-24 characters
- ✅ Be globally unique (for SQL Server and App Services)
- ✅ Not contain special characters except hyphens

**Good examples:**
- `apelamay-int` ✅
- `myapp-dev` ✅
- `company-prod-001` ✅

**Bad examples:**
- `MyApp_Dev` ❌ (uppercase, underscore)
- `app` ❌ (too short, not unique)
- `my app` ❌ (space)

## Backward Compatibility

**Breaking Change**: If you had existing deployments with custom database names, you'll need to:

1. **Option A**: Keep the old database and manually update connection strings
2. **Option B**: Export data from old database, deploy with new naming, import data
3. **Option C**: Update the ARM template to use a separate database name parameter

For this project, we're using the new convention going forward since you're doing a fresh deployment.

## Testing the Changes

Verify the naming works correctly:

```powershell
# Deploy
.\deploy-infrastructure-cli.ps1

# Verify SQL Server
az sql server show --resource-group apelamay-int-rg --name apelamay-int-sql

# Verify Database (should be named 'apelamay-int-db')
az sql db show --resource-group apelamay-int-rg --server apelamay-int-sql --name apelamay-int-db

# Verify API App
az webapp show --resource-group apelamay-int-rg --name apelamay-int-api

# Verify BFF App
az webapp show --resource-group apelamay-int-rg --name apelamay-int-bff
```

## Summary of Changes

| Item | Before | After |
|------|--------|-------|
| **Parameter Name** | `appNamePrefix` | `prefix` |
| **Default Value** | `"reactivities"` | `"apelamay-int"` |
| **Database Name Param** | `databaseName` (separate) | Generated from `prefix` |
| **Database Name** | User-specified or `"reactivitiesdb"` | `"{prefix}-db"` |
| **Script Parameter** | `$AppNamePrefix` | `$Prefix` |
| **CLI Argument** | `--parameters appNamePrefix=...` | `--parameters prefix=...` |

---

**Your ARM template is now using a unified naming convention with a single `prefix` parameter!** 🎉

Deploy with: `.\deploy-infrastructure-cli.ps1` to create all resources with consistent naming.
