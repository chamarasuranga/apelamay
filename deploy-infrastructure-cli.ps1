# Deploy Reactivities Infrastructure using ARM Template (Azure CLI)
# This script deploys all Azure resources needed for the application

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "reactivities-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$AppNamePrefix = "reactivities",
    
    [Parameter(Mandatory=$true)]
    [string]$SqlAdminPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanSku = "B1"
)

Write-Host "======================================"
Write-Host "🚀 Deploying Reactivities Infrastructure (Azure CLI)"
Write-Host "======================================"
Write-Host ""

# Check if logged in
Write-Host "Checking Azure CLI login..."
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure..."
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Host "✅ Logged in as: $($account.user.name)"
Write-Host "   Subscription: $($account.name)"
Write-Host ""

# Create resource group
Write-Host "Creating resource group: $ResourceGroupName..."
az group create --name $ResourceGroupName --location $Location --output none
Write-Host "✅ Resource group ready"
Write-Host ""

# Deploy template
Write-Host "Deploying ARM template..."
Write-Host "This may take 5-10 minutes..."
Write-Host ""

$deploymentName = "reactivities-$(Get-Date -Format 'yyyyMMddHHmmss')"

$result = az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --template-file azure-deploy.json `
    --parameters appNamePrefix=$AppNamePrefix `
    --parameters location=$Location `
    --parameters appServicePlanSku=$AppServicePlanSku `
    --parameters sqlAdministratorPassword=$SqlAdminPassword `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================"
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!"
    Write-Host "======================================"
    Write-Host ""
    Write-Host "🌐 Application URLs:"
    Write-Host "   BFF (Frontend): $($result.properties.outputs.bffAppUrl.value)"
    Write-Host "   API (Backend): $($result.properties.outputs.apiAppUrl.value)"
    Write-Host ""
    Write-Host "🗄️ Database:"
    Write-Host "   SQL Server: $($result.properties.outputs.sqlServerFqdn.value)"
    Write-Host ""
    Write-Host "🔧 Next Steps:"
    Write-Host "   1. Deploy your applications"
    Write-Host "   2. Visit: $($result.properties.outputs.bffAppUrl.value)"
    Write-Host ""
} else {
    Write-Error "❌ Deployment failed!"
    exit 1
}
