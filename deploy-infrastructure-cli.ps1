# Deploy Reactivities Infrastructure using ARM Template (Azure CLI)
# This script deploys all Azure resources needed for the application

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "apelamay-int-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "australiasoutheast",
    
    [Parameter(Mandatory=$false)]
    [string]$Prefix = "apelamay-int",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$SqlAdminPassword
)

Write-Host "======================================"
Write-Host "Deploying Infrastructure (Azure CLI)" -ForegroundColor Cyan
Write-Host "======================================"
Write-Host ""

# Prompt for SQL password if not provided
if (-not $SqlAdminPassword) {
    Write-Host "SQL Server Configuration:" -ForegroundColor Yellow
    $SqlAdminPassword = Read-Host "Enter SQL Administrator Password (min 8 chars)" -AsSecureString
    Write-Host ""
}

# Check if logged in
Write-Host "Checking Azure CLI login..."
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure..."
    az login    $account = az account show | ConvertFrom-Json
}

Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "   Subscription: $($account.name)"
Write-Host ""

# Create resource group
Write-Host "Creating resource group: $ResourceGroupName..."
az group create --name $ResourceGroupName --location $Location --output none
Write-Host "Resource group ready" -ForegroundColor Green
Write-Host ""

# Deploy template
Write-Host "Deploying ARM template..."
Write-Host "This may take 5-10 minutes..."
Write-Host ""

$deploymentName = "apelamay-int-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Convert SecureString to plain text for Azure CLI
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$result = az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --template-file azure-deploy.json `
    --parameters prefix=$Prefix `
    --parameters location=$Location `
    --parameters appServicePlanSku=$AppServicePlanSku `
    --parameters sqlAdministratorPassword=$PlainPassword `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================"
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "======================================"
    Write-Host ""
    Write-Host "Application URLs:" -ForegroundColor Cyan
    Write-Host "   BFF (Frontend): $($result.properties.outputs.bffAppUrl.value)"
    Write-Host "   API (Backend): $($result.properties.outputs.apiAppUrl.value)"
    Write-Host ""
    Write-Host "Database:" -ForegroundColor Cyan
    Write-Host "   SQL Server: $($result.properties.outputs.sqlServerFqdn.value)"
    Write-Host "   Database: $($result.properties.outputs.databaseName.value)"
    Write-Host ""
    Write-Host "Monitoring:" -ForegroundColor Cyan
    Write-Host "   Application Insights Key: $($result.properties.outputs.applicationInsightsInstrumentationKey.value)"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Deploy your API application to: $($result.properties.outputs.apiAppUrl.value)"
    Write-Host "   2. Deploy your BFF application to: $($result.properties.outputs.bffAppUrl.value)"
    Write-Host "   3. Configure any additional app settings (OAuth, Cloudinary, etc.)"
    Write-Host "   4. Run database migrations on your API"
    Write-Host "   5. Visit your application: $($result.properties.outputs.bffAppUrl.value)"
    Write-Host ""
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
