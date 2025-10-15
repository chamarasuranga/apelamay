# SQL Server Added to ARM Template - Summary

## Overview
I've successfully added Azure SQL Server and Database back to your ARM template based on the configuration you provided.

## What Was Added

### 1. Parameters
Added SQL Server configuration parameters:

```json
"sqlAdministratorLogin": {
  "type": "string",
  "defaultValue": "sqladmin",
  "metadata": {
    "description": "The admin username for SQL Server."
  }
},
"sqlAdministratorPassword": {
  "type": "securestring",
  "metadata": {
    "description": "The admin password for SQL Server. Must be at least 8 characters."
  }
},
"databaseName": {
  "type": "string",
  "defaultValue": "reactivitiesdb",
  "metadata": {
    "description": "The name of the SQL Database."
  }
},
"databaseSkuName": {
  "type": "string",
  "defaultValue": "S1",
  "allowedValues": ["Basic", "S0", "S1", "S2", "S3", "P1", "P2", "P3"],
  "metadata": {
    "description": "The SKU of the SQL Database. S1 is Standard tier with 20 DTUs."
  }
},
"databaseMaxSizeBytes": {
  "type": "int",
  "defaultValue": 10737418240,
  "metadata": {
    "description": "The maximum size of the database in bytes. Default is 10 GB."
  }
}
```

### 2. SQL Server Resource
Based on your Azure configuration:

```json
{
  "type": "Microsoft.Sql/servers",
  "apiVersion": "2022-02-01-preview",
  "name": "[variables('sqlServerName')]",
  "location": "[parameters('location')]",
  "kind": "v12.0",
  "properties": {
    "administratorLogin": "[parameters('sqlAdministratorLogin')]",
    "administratorLoginPassword": "[parameters('sqlAdministratorPassword')]",
    "version": "12.0",
    "minimalTlsVersion": "1.2",
    "publicNetworkAccess": "Enabled",
    "restrictOutboundNetworkAccess": "Disabled"
  }
}
```

### 3. SQL Database Resource
Configured with your specifications:

```json
{
  "type": "databases",
  "apiVersion": "2022-11-01-preview",
  "name": "[parameters('databaseName')]",
  "sku": {
    "name": "S1",
    "tier": "Standard",
    "capacity": 20
  },
  "kind": "v12.0,user",
  "properties": {
    "collation": "SQL_Latin1_General_CP1_CI_AS",
    "maxSizeBytes": 10737418240,  // 10 GB
    "catalogCollation": "SQL_Latin1_General_CP1_CI_AS",
    "zoneRedundant": false,
    "readScale": "Disabled",
    "requestedBackupStorageRedundancy": "Local",
    "isLedgerOn": false,
    "availabilityZone": "NoPreference"
  }
}
```

**Key Features:**
- ✅ **Tier**: Standard (S1)
- ✅ **Capacity**: 20 DTUs
- ✅ **Size**: 10 GB (10,737,418,240 bytes)
- ✅ **Collation**: SQL_Latin1_General_CP1_CI_AS
- ✅ **Backup**: Local redundancy
- ✅ **Security**: TLS 1.2 minimum
- ✅ **Public Access**: Enabled (Azure services allowed)

### 4. Firewall Rules
Added rule to allow Azure services:

```json
{
  "type": "firewallRules",
  "name": "AllowAllAzureIps",
  "properties": {
    "startIpAddress": "0.0.0.0",
    "endIpAddress": "0.0.0.0"
  }
}
```

**Note**: This allows all Azure services to connect. You can add specific IP rules later.

### 5. Connection String
Added to API App Service configuration:

```json
"connectionStrings": [
  {
    "name": "DefaultConnection",
    "connectionString": "Server=tcp:{sqlServerName}.database.windows.net,1433;Initial Catalog={databaseName};Persist Security Info=False;User ID={adminLogin};Password={adminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;",
    "type": "SQLAzure"
  }
]
```

### 6. Outputs
Added database information to deployment outputs:

```json
"outputs": {
  "sqlServerFqdn": {
    "type": "string",
    "value": "[reference(resourceId('Microsoft.Sql/servers', variables('sqlServerName'))).fullyQualifiedDomainName]"
  },
  "databaseName": {
    "type": "string",
    "value": "[parameters('databaseName')]"
  }
}
```

## Updated Deployment Script

The `deploy-infrastructure-cli.ps1` script now:

1. **Prompts for SQL Password** if not provided:
   ```powershell
   Enter SQL Administrator Password (min 8 chars):
   ```

2. **Passes password securely** to ARM template

3. **Displays database info** after deployment:
   ```
   🗄️ Database:
      SQL Server: apelamay-int-sql.database.windows.net
      Database: reactivitiesdb
   ```

## Resource Naming Convention

When deployed with prefix `apelamay-int`:

| Resource | Name | FQDN |
|----------|------|------|
| SQL Server | `apelamay-int-sql` | `apelamay-int-sql.database.windows.net` |
| SQL Database | `reactivitiesdb` | N/A |
| API App | `apelamay-int-api` | `apelamay-int-api.azurewebsites.net` |
| BFF App | `apelamay-int-bff` | `apelamay-int-bff.azurewebsites.net` |

## Database Configuration

### SKU Details
- **Tier**: Standard
- **Service Objective**: S1
- **DTUs**: 20
- **Storage**: 10 GB
- **Max Size**: 10,737,418,240 bytes

### Features
- ✅ Automatic backups (7-35 days retention)
- ✅ Point-in-time restore
- ✅ Geo-redundant backup storage (configurable)
- ✅ TLS 1.2 encryption
- ✅ SQL Server version 12.0
- ✅ Azure Active Directory authentication support

## Cost Estimate (Australia Southeast)

| Resource | SKU | Monthly Cost (AUD) |
|----------|-----|-------------------|
| App Service Plan | B1 | ~$18 |
| SQL Database | S1 (20 DTU) | ~$23 |
| Application Insights | Free tier | $0 |
| **Total** | | **~$41** |

**Note**: S1 tier is ~$15 USD/month (~$23 AUD)

## How to Deploy

### Option 1: With Default Database Settings

```powershell
# Will prompt for SQL password
.\deploy-infrastructure-cli.ps1
```

### Option 2: With Custom Settings

```powershell
# Create secure password
$password = ConvertTo-SecureString "YourStrongP@ssw0rd!" -AsPlainText -Force

# Deploy with custom configuration
.\deploy-infrastructure-cli.ps1 `
    -ResourceGroupName "apelamay-int-rg" `
    -Location "australiasoutheast" `
    -AppNamePrefix "apelamay-int" `
    -AppServicePlanSku "B1" `
    -SqlAdminPassword $password
```

### Password Requirements

Your SQL password must:
- ✅ Be at least 8 characters long
- ✅ Contain uppercase letters (A-Z)
- ✅ Contain lowercase letters (a-z)
- ✅ Contain numbers (0-9)
- ✅ Contain special characters (@, #, $, etc.)

**Example strong password**: `MyApp2025!Secure`

## After Deployment

### 1. Verify Database Connection

```powershell
# Get the SQL Server name from deployment output
$sqlServer = "apelamay-int-sql.database.windows.net"

# Test connection (requires SQL Server tools)
sqlcmd -S $sqlServer -d reactivitiesdb -U sqladmin -P [your-password] -Q "SELECT @@VERSION"
```

### 2. Configure Database in Your API

The connection string is automatically configured in your API App Service. You can verify it in:

- **Azure Portal** → Your API App → Configuration → Connection strings
- Or use Azure CLI:
  ```powershell
  az webapp config connection-string list --name apelamay-int-api --resource-group apelamay-int-rg
  ```

### 3. Run Database Migrations

After deploying your API:

```bash
# From your API project
dotnet ef database update
```

Or configure automatic migrations in your `Program.cs`.

## Security Best Practices

### 1. Restrict Firewall Rules
After deployment, add specific IP addresses instead of allowing all Azure services:

```powershell
# Add your office/home IP
az sql server firewall-rule create `
    --resource-group apelamay-int-rg `
    --server apelamay-int-sql `
    --name "MyOfficeIP" `
    --start-ip-address "203.0.113.50" `
    --end-ip-address "203.0.113.50"
```

### 2. Enable Azure AD Authentication
Consider enabling Azure AD authentication for better security:

```powershell
az sql server ad-admin create `
    --resource-group apelamay-int-rg `
    --server-name apelamay-int-sql `
    --display-name "Your Name" `
    --object-id "your-azure-ad-object-id"
```

### 3. Use Managed Identity
For production, use Managed Identity instead of SQL authentication:
- Enable Managed Identity on your API App Service
- Grant database permissions to the Managed Identity
- Update connection string to use Managed Identity

## Monitoring

### View Database Metrics

**Azure Portal:**
1. Navigate to your SQL Database
2. Click **Metrics** to view:
   - DTU percentage
   - Database size
   - Connection failures
   - Query performance

**Azure CLI:**
```powershell
az monitor metrics list `
    --resource "/subscriptions/{sub-id}/resourceGroups/apelamay-int-rg/providers/Microsoft.Sql/servers/apelamay-int-sql/databases/reactivitiesdb" `
    --metric "dtu_consumption_percent"
```

## Troubleshooting

### "Cannot connect to SQL Server"
1. Check firewall rules allow your IP
2. Verify password is correct
3. Ensure SQL Server public access is enabled
4. Check if your API is using the correct connection string

### "Database is not accessible"
1. Check if database is online: `az sql db show --resource-group apelamay-int-rg --server apelamay-int-sql --name reactivitiesdb`
2. Verify service tier has not exceeded limits
3. Check Application Insights for connection errors

### "Password requirements not met"
Ensure your password meets all complexity requirements:
- Minimum 8 characters
- Mix of upper/lower case, numbers, and special characters

## Backup and Restore

### View Available Restore Points

```powershell
az sql db show `
    --resource-group apelamay-int-rg `
    --server apelamay-int-sql `
    --name reactivitiesdb `
    --query "earliestRestoreDate"
```

### Restore Database

```powershell
az sql db restore `
    --resource-group apelamay-int-rg `
    --server apelamay-int-sql `
    --name reactivitiesdb-restored `
    --source-database reactivitiesdb `
    --time "2025-10-15T00:00:00Z"
```

## Next Steps

1. ✅ **Deploy Infrastructure**: Run `.\deploy-infrastructure-cli.ps1`
2. ✅ **Deploy API**: Use Azure DevOps or manual deployment
3. ✅ **Run Migrations**: Execute `dotnet ef database update`
4. ✅ **Deploy BFF**: Deploy your frontend application
5. ✅ **Test**: Verify database connectivity and application functionality
6. 🔐 **Secure**: Configure firewall rules and consider Managed Identity

## Resources Created

After deployment, your resource group will contain:

| Resource Type | Count | Names |
|---------------|-------|-------|
| App Service Plan | 1 | `apelamay-int-plan` |
| App Services | 2 | `apelamay-int-api`, `apelamay-int-bff` |
| SQL Server | 1 | `apelamay-int-sql` |
| SQL Database | 1 | `reactivitiesdb` |
| Application Insights | 1 | `apelamay-int-insights` |
| **Total** | **6** | |

---

**Your ARM template is now ready to deploy with SQL Server support!** 🎉

Run `.\deploy-infrastructure-cli.ps1` to deploy all resources including the SQL Server and database.
