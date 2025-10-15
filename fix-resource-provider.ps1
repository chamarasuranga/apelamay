# Fix Resource Provider Registration Issue
# This script registers the required resource providers for Azure deployment

Write-Host "======================================"
Write-Host "🔧 Fixing Resource Provider Issue"
Write-Host "======================================"
Write-Host ""

# Required resource providers
$providers = @(
    "Microsoft.OperationalInsights",
    "Microsoft.Insights",
    "Microsoft.Web"
)

Write-Host "Registering required resource providers..."
Write-Host ""

foreach ($provider in $providers) {
    Write-Host "Registering: $provider" -ForegroundColor Cyan
    
    try {
        az provider register --namespace $provider --wait
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $provider registered successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Failed to register $provider" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Error registering $provider : $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "======================================"
Write-Host "Checking registration status..."
Write-Host "======================================"
Write-Host ""

foreach ($provider in $providers) {
    $status = az provider show --namespace $provider --query "registrationState" -o tsv
    Write-Host "$provider : $status" -ForegroundColor $(if ($status -eq "Registered") { "Green" } else { "Yellow" })
}

Write-Host ""
Write-Host "======================================"
Write-Host "✅ Resource Provider Registration Complete"
Write-Host "======================================"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Wait 1-2 minutes for registration to complete"
Write-Host "2. Run: .\deploy-infrastructure-cli.ps1"
Write-Host ""
