# Deploy Infrastructure for Specific Environment
# Usage: .\deploy-environment.ps1 -Environment int|uat|prod

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("int", "uat", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Prefix = "apelamay",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "australiasoutheast",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$SqlAdminPassword
)

$ResourceGroupName = "$Prefix-$Environment-rg"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deploying $($Environment.ToUpper()) Environment"
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Environment: $Environment"
Write-Host "  Resource Group: $ResourceGroupName"
Write-Host "  Location: $Location"
Write-Host "  Prefix: $Prefix"
Write-Host ""

# Prompt for SQL password if not provided
if (-not $SqlAdminPassword) {
    Write-Host "SQL Server Configuration:" -ForegroundColor Yellow
    $SqlAdminPassword = Read-Host "Enter SQL Administrator Password for $Environment (min 8 chars)" -AsSecureString
    Write-Host ""
}

# Check if logged in
Write-Host "Checking Azure CLI login..."
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure..."
    az login
    $account = az account show | ConvertFrom-Json
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
Write-Host "Deploying ARM template for $Environment environment..."
Write-Host "This may take 5-10 minutes..."
Write-Host ""

$deploymentName = "$Prefix-$Environment-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Convert SecureString to plain text for Azure CLI
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$result = az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --template-file azure-deploy.json `
    --parameters environment=$Environment `
    --parameters prefix=$Prefix `
    --parameters location=$Location `
    --parameters appServicePlanSku=$AppServicePlanSku `
    --parameters sqlAdministratorPassword=$PlainPassword `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL! ($Environment)" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Application URLs:" -ForegroundColor Cyan
    Write-Host "   BFF (Frontend): $($result.properties.outputs.bffAppUrl.value)"
    Write-Host "   API (Backend): $($result.properties.outputs.apiAppUrl.value)"
    Write-Host ""
    Write-Host "Database:" -ForegroundColor Cyan
    Write-Host "   SQL Server: $($result.properties.outputs.sqlServerFqdn.value)"
    Write-Host "   Database: $($result.properties.outputs.databaseName.value)"
    Write-Host ""
    Write-Host "Resource Names:" -ForegroundColor Cyan
    Write-Host "   API App: $Prefix-$Environment-api"
    Write-Host "   BFF App: $Prefix-$Environment-bff"
    Write-Host "   SQL Server: $Prefix-$Environment-sql"
    Write-Host "   Database: $Prefix-$Environment-db"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Commit and push your code to trigger pipeline"
    Write-Host "   2. Pipeline will auto-deploy based on branch:"
    Write-Host "      - 'develop' branch -> INT environment"
    Write-Host "      - 'uat' branch -> UAT environment"
    Write-Host "      - 'main' branch -> PROD environment"
    Write-Host ""
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
