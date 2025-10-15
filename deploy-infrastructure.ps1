# Deploy Reactivities Infrastructure using ARM Template
# This script deploys all Azure resources needed for the application

param(    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "apelamayi-int-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$AppNamePrefix = "apelamayi-int",
    
    [Parameter(Mandatory=$true)]
    [SecureString]$SqlAdminPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory=$false)]
    [string]$CloudinaryCloudName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$CloudinaryApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$CloudinaryApiSecret,
    
    [Parameter(Mandatory=$false)]
    [SecureString]$ResendApiToken,
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubClientId = ""
)

Write-Host "======================================"
Write-Host "🚀 Deploying Reactivities Infrastructure"
Write-Host "======================================"
Write-Host ""

# Check if logged in to Azure
Write-Host "Checking Azure login..."
$context = Get-AzContext
if (-not $context) {
    Write-Host "Please login to Azure..."
    Connect-AzAccount
}

$context = Get-AzContext
Write-Host "✅ Logged in as: $($context.Account.Id)"
Write-Host "   Subscription: $($context.Subscription.Name)"
Write-Host ""

# Create resource group if it doesn't exist
Write-Host "Creating resource group: $ResourceGroupName..."
$rg = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
if (-not $rg) {
    New-AzResourceGroup -Name $ResourceGroupName -Location $Location | Out-Null
    Write-Host "✅ Resource group created"
} else {
    Write-Host "✅ Resource group already exists"
}
Write-Host ""

# Prepare deployment parameters
$deploymentParams = @{
    appNamePrefix = $AppNamePrefix
    location = $Location
    appServicePlanSku = $AppServicePlanSku
    sqlAdministratorPassword = $SqlAdminPassword
}

# Add optional parameters if provided
if ($CloudinaryCloudName) { $deploymentParams['cloudinaryCloudName'] = $CloudinaryCloudName }
if ($CloudinaryApiKey) { $deploymentParams['cloudinaryApiKey'] = $CloudinaryApiKey }
if ($CloudinaryApiSecret) { $deploymentParams['cloudinaryApiSecret'] = $CloudinaryApiSecret }
if ($ResendApiToken) { $deploymentParams['resendApiToken'] = $ResendApiToken }
if ($GitHubClientId) { $deploymentParams['githubClientId'] = $GitHubClientId }

# Deploy ARM template
Write-Host "Deploying ARM template..."
Write-Host "This may take 5-10 minutes..."
Write-Host ""

$deploymentName = "reactivities-deployment-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    $deployment = New-AzResourceGroupDeployment `
        -Name $deploymentName `
        -ResourceGroupName $ResourceGroupName `
        -TemplateFile "azure-deploy.json" `
        -TemplateParameterObject $deploymentParams `
        -Verbose

    Write-Host ""
    Write-Host "======================================"
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!"
    Write-Host "======================================"
    Write-Host ""
    Write-Host "📋 Deployment Details:"
    Write-Host "   Deployment Name: $deploymentName"
    Write-Host "   Resource Group: $ResourceGroupName"
    Write-Host "   Location: $Location"
    Write-Host ""
    Write-Host "🌐 Application URLs:"
    Write-Host "   BFF (Frontend): $($deployment.Outputs.bffAppUrl.Value)"
    Write-Host "   API (Backend): $($deployment.Outputs.apiAppUrl.Value)"
    Write-Host ""
    Write-Host "🗄️ Database:"
    Write-Host "   SQL Server: $($deployment.Outputs.sqlServerFqdn.Value)"
    Write-Host "   Database: reactivitiesdb"
    Write-Host ""
    Write-Host "📊 Monitoring:"
    Write-Host "   Application Insights Key: $($deployment.Outputs.applicationInsightsInstrumentationKey.Value)"
    Write-Host ""
    Write-Host "🔧 Next Steps:"
    Write-Host "   1. Update client/.env.production with BFF URL"
    Write-Host "   2. Build and deploy your applications:"
    Write-Host "      - Run: .\deploy-api.ps1"
    Write-Host "      - Run: .\deploy-bff.ps1"
    Write-Host "   3. Or set up CI/CD pipeline using azure-pipelines.yml"
    Write-Host ""
    Write-Host "======================================"

    # Save outputs to file
    $outputs = @{
        BffUrl = $deployment.Outputs.bffAppUrl.Value
        ApiUrl = $deployment.Outputs.apiAppUrl.Value
        SqlServerFqdn = $deployment.Outputs.sqlServerFqdn.Value
        ResourceGroupName = $deployment.Outputs.resourceGroupName.Value
        DeploymentDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    $outputs | ConvertTo-Json | Out-File -FilePath "deployment-outputs.json" -Encoding UTF8
    Write-Host "💾 Deployment outputs saved to: deployment-outputs.json"
    Write-Host ""

} catch {
    Write-Error "❌ Deployment failed: $_"
    Write-Host ""
    Write-Host "To view detailed error information:"
    Write-Host "Get-AzResourceGroupDeploymentOperation -ResourceGroupName $ResourceGroupName -DeploymentName $deploymentName"
    exit 1
}
