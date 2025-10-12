# Deploy API to Azure
# Run this script from the solution root

Write-Host "🚀 Starting API Deployment..." -ForegroundColor Green

# Build API project
Write-Host "`n🔨 Building API project..." -ForegroundColor Cyan
dotnet publish API/API.csproj -c Release -o ./publish/api

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ API build completed" -ForegroundColor Green

# Deploy to Azure (requires Azure CLI)
Write-Host "`n☁️ Deploying to Azure App Service..." -ForegroundColor Cyan
Write-Host "Run the following command to deploy:" -ForegroundColor Yellow
Write-Host "az webapp deploy --resource-group YOUR-RESOURCE-GROUP --name YOUR-API-APP-NAME --src-path ./publish/api --type zip" -ForegroundColor White

Write-Host "`n✅ Build completed! Ready for deployment" -ForegroundColor Green
