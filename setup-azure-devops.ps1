# Azure DevOps Quick Setup Script
# Run this script to create all necessary Azure resources

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup = "reactivities-rg",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$true)]
    [string]$ApiAppName = "reactivities-api",
    
    [Parameter(Mandatory=$true)]
    [string]$BffAppName = "reactivities-bff",
    
    [string]$AppServicePlan = "reactivities-plan",
    [string]$Sku = "B1"
)

Write-Host "======================================"
Write-Host "🚀 Azure Resources Setup for Azure DevOps"
Write-Host "======================================"
Write-Host ""

# Login check
Write-Host "Checking Azure login..."
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure..."
    az login
}

Write-Host "✅ Logged in as: $($account.user.name)"
Write-Host "   Subscription: $($account.name)"
Write-Host ""

# Create Resource Group
Write-Host "Creating Resource Group: $ResourceGroup..."
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource Group created"
} else {
    Write-Host "⚠️  Resource Group might already exist"
}

# Create App Service Plan
Write-Host "Creating App Service Plan: $AppServicePlan..."
az appservice plan create `
    --name $AppServicePlan `
    --resource-group $ResourceGroup `
    --sku $Sku `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service Plan created"
} else {
    Write-Host "⚠️  App Service Plan might already exist"
}

# Create API App Service
Write-Host "Creating API App Service: $ApiAppName..."
az webapp create `
    --name $ApiAppName `
    --resource-group $ResourceGroup `
    --plan $AppServicePlan `
    --runtime "DOTNET:9" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API App Service created"
} else {
    Write-Error "❌ Failed to create API App Service"
    exit 1
}

# Create BFF App Service
Write-Host "Creating BFF App Service: $BffAppName..."
az webapp create `
    --name $BffAppName `
    --resource-group $ResourceGroup `
    --plan $AppServicePlan `
    --runtime "DOTNET:9" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BFF App Service created"
} else {
    Write-Error "❌ Failed to create BFF App Service"
    exit 1
}

# Enable HTTPS Only
Write-Host "Enabling HTTPS only..."
az webapp update --resource-group $ResourceGroup --name $ApiAppName --https-only true --output none
az webapp update --resource-group $ResourceGroup --name $BffAppName --https-only true --output none
Write-Host "✅ HTTPS enforced"

# Configure App Settings
Write-Host "Configuring API App Settings..."
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $ApiAppName `
    --settings ASPNETCORE_ENVIRONMENT="Production" `
    --output none

Write-Host "Configuring BFF App Settings..."
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $BffAppName `
    --settings `
        ASPNETCORE_ENVIRONMENT="Production" `
        ApiUrl="https://$ApiAppName.azurewebsites.net" `
    --output none

Write-Host "✅ App Settings configured"

# Get URLs
$apiUrl = "https://$ApiAppName.azurewebsites.net"
$bffUrl = "https://$BffAppName.azurewebsites.net"

Write-Host ""
Write-Host "======================================"
Write-Host "✅ SETUP COMPLETE!"
Write-Host "======================================"
Write-Host ""
Write-Host "📋 Resource Details:"
Write-Host "   Resource Group: $ResourceGroup"
Write-Host "   Location: $Location"
Write-Host "   App Service Plan: $AppServicePlan ($Sku)"
Write-Host ""
Write-Host "🌐 Application URLs:"
Write-Host "   API: $apiUrl"
Write-Host "   BFF (Frontend): $bffUrl"
Write-Host ""
Write-Host "🔧 Next Steps:"
Write-Host "   1. Update client/.env.production with:"
Write-Host "      VITE_REDIRECT_URL=$bffUrl/auth-callback"
Write-Host ""
Write-Host "   2. Update BFF/appsettings.Production.json with:"
Write-Host "      ApiUrl: $apiUrl"
Write-Host ""
Write-Host "   3. Go to Azure DevOps and create a Service Connection:"
Write-Host "      - Project Settings → Service Connections"
Write-Host "      - New Service Connection → Azure Resource Manager"
Write-Host "      - Select Subscription: $($account.name)"
Write-Host "      - Resource Group: $ResourceGroup"
Write-Host "      - Connection Name: AzureServiceConnection"
Write-Host ""
Write-Host "   4. Create azure-pipelines.yml and push to repository"
Write-Host ""
Write-Host "   5. Create Pipeline in Azure DevOps:"
Write-Host "      - Pipelines → New Pipeline"
Write-Host "      - Select your repository"
Write-Host "      - Choose 'Existing Azure Pipelines YAML file'"
Write-Host "      - Select /azure-pipelines.yml"
Write-Host ""
Write-Host "======================================"

# Save configuration to file
$config = @{
    ResourceGroup = $ResourceGroup
    Location = $Location
    ApiAppName = $ApiAppName
    BffAppName = $BffAppName
    ApiUrl = $apiUrl
    BffUrl = $bffUrl
    AppServicePlan = $AppServicePlan
    Sku = $Sku
    CreatedDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$config | ConvertTo-Json | Out-File -FilePath "azure-devops-config.json" -Encoding UTF8
Write-Host "💾 Configuration saved to: azure-devops-config.json"
Write-Host ""
