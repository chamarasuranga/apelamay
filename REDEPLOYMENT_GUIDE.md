# ARM Template Redeployment - How It Works

## Overview
When you run your infrastructure deployment script (`deploy-infrastructure-cli.ps1`) a second time, Azure Resource Manager uses **incremental deployment mode** by default. This means it intelligently updates your infrastructure without recreating everything.

## Deployment Modes

### 1. Incremental Mode (Default) ✅
**What happens:**
- Compares the ARM template with existing resources
- **Creates** resources that don't exist
- **Updates** resources that have changed
- **Leaves untouched** resources that haven't changed
- **Does NOT delete** resources not in the template

**This is what your script uses!**

### 2. Complete Mode (Not Used)
**What happens:**
- **Deletes** any resources in the resource group NOT in the template
- **Dangerous** - can accidentally delete resources
- Must be explicitly specified

## How Your Deployment Works

### First Deployment
```powershell
.\deploy-infrastructure-cli.ps1
```

**Creates:**
1. ✅ App Service Plan: `apelamay-int-plan`
2. ✅ SQL Server: `apelamay-int-sql`
3. ✅ SQL Database: `apelamay-int-db`
4. ✅ API App Service: `apelamay-int-api`
5. ✅ BFF App Service: `apelamay-int-bff`
6. ✅ Application Insights: `apelamay-int-insights`

**Result:** All resources created fresh

---

### Second Deployment (No Changes)
```powershell
.\deploy-infrastructure-cli.ps1
```

**Azure checks each resource:**
- App Service Plan → No changes detected → **Skipped**
- SQL Server → No changes detected → **Skipped**
- SQL Database → No changes detected → **Skipped**
- API App Service → No changes detected → **Skipped**
- BFF App Service → No changes detected → **Skipped**
- Application Insights → No changes detected → **Skipped**

**Result:** ✅ Deployment succeeds in seconds (no actual changes)

**Important:** Your apps, database data, and configurations remain untouched!

---

### Second Deployment (With Changes)
Let's say you modify the ARM template to add a new app setting:

```json
{
  "name": "NewFeature__Enabled",
  "value": "true"
}
```

Then run:
```powershell
.\deploy-infrastructure-cli.ps1
```

**Azure checks each resource:**
- App Service Plan → No changes → **Skipped**
- SQL Server → No changes → **Skipped**
- SQL Database → No changes → **Skipped**
- **API App Service → App settings changed → Updates only app settings**
- BFF App Service → No changes → **Skipped**
- Application Insights → No changes → **Skipped**

**Result:** ✅ Only the API app configuration is updated

**Impact:**
- ⚠️ API app **may restart** (brief downtime ~30 seconds)
- ✅ Database remains online with all data intact
- ✅ BFF app continues running
- ✅ No resource recreation

---

## Common Scenarios

### Scenario 1: Change App Service Plan SKU
**Template Change:**
```json
"appServicePlanSku": {
  "defaultValue": "S1"  // Changed from B1
}
```

**Run deployment:**
```powershell
.\deploy-infrastructure-cli.ps1 -AppServicePlanSku "S1"
```

**What happens:**
- ✅ App Service Plan is **scaled up** from B1 to S1
- ✅ Apps continue running during scale operation
- ✅ Database remains untouched
- ⏱️ Takes ~2-3 minutes

**Impact:**
- 🔄 Apps may restart briefly
- 💰 Monthly cost increases

---

### Scenario 2: Add New App Setting
**Template Change:**
```json
"appSettings": [
  // ...existing settings...
  {
    "name": "Feature__NewFeature",
    "value": "enabled"
  }
]
```

**Run deployment:**
```powershell
.\deploy-infrastructure-cli.ps1
```

**What happens:**
- ✅ New app setting added to API app
- ✅ Existing app settings preserved
- ⚠️ App restarts to pick up new configuration

**Impact:**
- 🔄 Brief app restart (~30 seconds)
- ✅ Database data safe
- ✅ Existing settings unchanged

---

### Scenario 3: Change Database SKU
**Template Change:**
```json
"databaseSkuName": {
  "defaultValue": "S2"  // Changed from S1
}
```

**Run deployment:**
```powershell
.\deploy-infrastructure-cli.ps1
```

**What happens:**
- ✅ Database is **scaled** from S1 to S2
- ✅ **All data preserved**
- ✅ Database remains online during scale operation
- ⏱️ Takes ~5-10 minutes

**Impact:**
- ✅ No data loss
- ✅ Minimal downtime (seconds)
- 💰 Monthly cost increases

---

### Scenario 4: Add New Resource (e.g., Storage Account)
**Template Change:**
```json
"resources": [
  // ...existing resources...
  {
    "type": "Microsoft.Storage/storageAccounts",
    "name": "[concat(parameters('prefix'), 'storage')]",
    "location": "[parameters('location')]",
    // ...configuration...
  }
]
```

**Run deployment:**
```powershell
.\deploy-infrastructure-cli.ps1
```

**What happens:**
- ✅ New storage account is **created**
- ✅ All existing resources remain unchanged
- ✅ No restarts of existing apps

**Impact:**
- ✅ Zero impact on existing resources
- ✅ New resource available immediately
- 💰 Additional cost for storage

---

### Scenario 5: Remove Resource from Template
**Template Change:**
Remove Application Insights from template

**Run deployment:**
```powershell
.\deploy-infrastructure-cli.ps1
```

**What happens (Incremental Mode):**
- ✅ Application Insights resource **remains in Azure**
- ⚠️ It's no longer managed by your template
- ℹ️ You'll need to delete it manually if needed

**Important:** Incremental mode never deletes resources!

---

## What Gets Preserved?

### ✅ Always Preserved
1. **Database data** - All tables, rows, stored procedures
2. **App Service files** - Deployed application code
3. **Configuration not in template** - Manual settings you added
4. **Logs and metrics** - Historical data
5. **SSL certificates** - Custom domains and certificates
6. **Deployment slots** - If you created any

### ⚠️ May Be Updated
1. **App settings** - If changed in template
2. **Connection strings** - If changed in template
3. **Scale settings** - If SKU changed
4. **Firewall rules** - If changed in template

### ❌ Cannot Change (Requires Recreation)
Some properties cannot be changed and require resource deletion/recreation:
1. **SQL Server name** - Immutable
2. **Database name** - Immutable
3. **App Service name** - Immutable
4. **Location** - Cannot move resources

If you try to change these, deployment will **fail** with an error.

---

## Real-World Example: Adding Redis Cache

Let's say you want to add Azure Redis Cache to your infrastructure.

### Step 1: Update ARM Template

```json
"variables": {
  "appServicePlanName": "[concat(parameters('prefix'), '-plan')]",
  "apiAppName": "[concat(parameters('prefix'), '-api')]",
  "bffAppName": "[concat(parameters('prefix'), '-bff')]",
  "sqlServerName": "[concat(parameters('prefix'), '-sql')]",
  "databaseName": "[concat(parameters('prefix'), '-db')]",
  "redisCacheName": "[concat(parameters('prefix'), '-redis')]",  // ✅ New
  "applicationInsightsName": "[concat(parameters('prefix'), '-insights')]",
  // ...rest
}
```

```json
"resources": [
  // ...existing resources...
  
  // ✅ Add Redis Cache resource
  {
    "type": "Microsoft.Cache/redis",
    "apiVersion": "2023-08-01",
    "name": "[variables('redisCacheName')]",
    "location": "[parameters('location')]",
    "properties": {
      "sku": {
        "name": "Basic",
        "family": "C",
        "capacity": 0
      },
      "enableNonSslPort": false,
      "minimumTlsVersion": "1.2"
    }
  }
]
```

```json
// ✅ Add Redis connection string to API app
"appSettings": [
  // ...existing settings...
  {
    "name": "Redis__ConnectionString",
    "value": "[concat(variables('redisCacheName'), '.redis.cache.windows.net:6380,password=', listKeys(resourceId('Microsoft.Cache/redis', variables('redisCacheName')), '2023-08-01').primaryKey, ',ssl=True,abortConnect=False')]"
  }
]
```

### Step 2: Run Deployment

```powershell
.\deploy-infrastructure-cli.ps1
```

### Step 3: What Happens

**Timeline:**
```
[00:00] Starting deployment...
[00:01] Checking existing resources...
[00:02] ✅ App Service Plan - No changes, skipped
[00:02] ✅ SQL Server - No changes, skipped
[00:03] ✅ SQL Database - No changes, skipped
[00:03] 🔄 API App Service - Detected app settings change, updating...
[00:15] 🔄 API App restarting...
[00:45] ✅ API App running with new config
[00:45] 🆕 Creating Redis Cache...
[05:30] ✅ Redis Cache created
[05:35] ✅ Deployment complete!
```

**Result:**
- ✅ Redis Cache created: `apelamay-int-redis`
- ✅ API app updated with Redis connection string
- ✅ API app restarted (30 second downtime)
- ✅ Database untouched
- ✅ BFF app untouched
- 💰 Additional cost: ~$10/month for Basic Redis

---

## Best Practices for Redeployment

### 1. Test Changes First
```powershell
# Validate template without deploying
az deployment group validate `
    --resource-group apelamay-int-rg `
    --template-file azure-deploy.json `
    --parameters prefix=apelamay-int
```

### 2. Use What-If Mode
```powershell
# See what would change WITHOUT making changes
az deployment group what-if `
    --resource-group apelamay-int-rg `
    --template-file azure-deploy.json `
    --parameters prefix=apelamay-int
```

**Output example:**
```
Resource changes: 2 to modify, 1 to create

  + Microsoft.Cache/redis/apelamay-int-redis
    
  ~ Microsoft.Web/sites/apelamay-int-api
    ~ properties.siteConfig.appSettings[7]:
      + name: "Redis__ConnectionString"
      + value: "apelamay-int-redis.redis..."
```

### 3. Deploy to Dev First
```powershell
# Test in dev environment first
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-dev-rg" `
    -Prefix "apelamay-dev"

# If successful, deploy to production
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-prod-rg" `
    -Prefix "apelamay-prod"
```

### 4. Use Parameters File for Changes
Create `azure-deploy.parameters.json`:
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "prefix": {
      "value": "apelamay-int"
    },
    "appServicePlanSku": {
      "value": "B1"
    },
    "databaseSkuName": {
      "value": "S1"
    }
  }
}
```

Then deploy:
```powershell
az deployment group create `
    --resource-group apelamay-int-rg `
    --template-file azure-deploy.json `
    --parameters @azure-deploy.parameters.json `
    --parameters sqlAdministratorPassword=$password
```

### 5. Monitor Deployment
```powershell
# Watch deployment progress
az deployment group show `
    --resource-group apelamay-int-rg `
    --name apelamay-int-20251015120000 `
    --query "properties.provisioningState"
```

---

## Troubleshooting Redeployment

### Issue 1: "Resource already exists"
**Error:**
```
The resource already exists and is not managed by this template
```

**Cause:** Resource was created manually or by another process

**Solution:**
1. Option A: Remove resource from Azure manually
2. Option B: Import resource into template
3. Option C: Rename resource in template

### Issue 2: "Cannot change immutable property"
**Error:**
```
Cannot update property 'name' on resource type 'Microsoft.Sql/servers'
```

**Cause:** Trying to change a property that requires recreation

**Solution:**
- Don't change immutable properties
- Create a new resource with a different name instead
- Or manually delete and recreate the resource

### Issue 3: "Concurrent updates conflict"
**Error:**
```
Another operation is in progress
```

**Cause:** Previous deployment still running or resource locked

**Solution:**
```powershell
# Wait for previous deployment to complete
az deployment group list `
    --resource-group apelamay-int-rg `
    --query "[?properties.provisioningState=='Running']"

# Or cancel it
az deployment group cancel `
    --resource-group apelamay-int-rg `
    --name apelamay-int-20251015120000
```

### Issue 4: "Validation failed"
**Error:**
```
Template validation failed: The template parameter 'prefix' is not found
```

**Cause:** Template syntax error or missing parameter

**Solution:**
```powershell
# Validate template
az deployment group validate `
    --resource-group apelamay-int-rg `
    --template-file azure-deploy.json `
    --parameters prefix=apelamay-int
```

---

## Downtime Considerations

### Zero Downtime Updates
These operations typically have no downtime:
- ✅ Adding new resources
- ✅ Scaling up App Service Plan
- ✅ Scaling up Database
- ✅ Changing configuration (with deployment slots)
- ✅ Adding firewall rules

### Brief Downtime (~30 seconds)
These operations cause brief restarts:
- ⚠️ Changing app settings
- ⚠️ Changing connection strings
- ⚠️ Scaling down App Service Plan
- ⚠️ Changing .NET version

### Longer Downtime (Minutes)
These operations take longer:
- ⚠️⚠️ Database tier changes (5-10 minutes)
- ⚠️⚠️ Database region migration (hours)
- ⚠️⚠️ Complete resource recreation

### Use Deployment Slots for Zero Downtime
```json
{
  "type": "Microsoft.Web/sites/slots",
  "apiVersion": "2022-09-01",
  "name": "[concat(variables('apiAppName'), '/staging')]",
  "location": "[parameters('location')]",
  "dependsOn": [
    "[resourceId('Microsoft.Web/sites', variables('apiAppName'))]"
  ],
  "properties": {
    "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]"
  }
}
```

Then swap:
```powershell
# Deploy to staging slot (no downtime)
az webapp deployment source config-zip `
    --resource-group apelamay-int-rg `
    --name apelamay-int-api `
    --slot staging `
    --src api.zip

# Swap staging to production (instant)
az webapp deployment slot swap `
    --resource-group apelamay-int-rg `
    --name apelamay-int-api `
    --slot staging `
    --target-slot production
```

---

## Summary

### Key Takeaways

1. **✅ Safe to Rerun**
   - Running deployment multiple times is safe
   - Only changed resources are updated
   - Incremental mode prevents accidental deletions

2. **✅ Data Preserved**
   - Database data always preserved
   - App files preserved
   - Manual configurations preserved (if not in template)

3. **⚠️ Be Aware**
   - App settings changes cause restarts
   - Some properties are immutable
   - Test in dev first

4. **🔧 Best Practices**
   - Use `what-if` mode to preview changes
   - Test in dev environment first
   - Use deployment slots for zero downtime
   - Monitor deployments

5. **💡 Common Pattern**
   ```
   Edit ARM Template → Validate → What-If → Test in Dev → Deploy to Prod
   ```

---

## Quick Command Reference

```powershell
# Validate template
az deployment group validate --resource-group apelamay-int-rg --template-file azure-deploy.json

# Preview changes (what-if)
az deployment group what-if --resource-group apelamay-int-rg --template-file azure-deploy.json

# Deploy changes
.\deploy-infrastructure-cli.ps1

# Check deployment status
az deployment group show --resource-group apelamay-int-rg --name <deployment-name>

# List all deployments
az deployment group list --resource-group apelamay-int-rg

# Cancel running deployment
az deployment group cancel --resource-group apelamay-int-rg --name <deployment-name>
```

---

**Your infrastructure is designed to be safely updated multiple times!** Use incremental deployments to add features, scale resources, and update configurations without fear of data loss. 🎉
