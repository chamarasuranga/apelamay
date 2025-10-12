# Deploy BFF with React SPA to Azure
# Run this script from the solution root

Write-Host "🚀 Starting BFF Deployment..." -ForegroundColor Green

# Step 1: Build React app
Write-Host "`n📦 Building React application..." -ForegroundColor Cyan
Set-Location client
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ React build completed" -ForegroundColor Green

# Step 2: Build BFF project
Write-Host "`n🔨 Building BFF project..." -ForegroundColor Cyan
Set-Location ..
dotnet publish BFF/BFF.csproj -c Release -o ./publish/bff

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ BFF build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ BFF build completed" -ForegroundColor Green

# Step 3: Deploy to Azure (requires Azure CLI)
Write-Host "`n☁️ Deploying to Azure App Service..." -ForegroundColor Cyan
Write-Host "Run the following command to deploy:" -ForegroundColor Yellow
Write-Host "az webapp deploy --resource-group YOUR-RESOURCE-GROUP --name YOUR-BFF-APP-NAME --src-path ./publish/bff --type zip" -ForegroundColor White

Write-Host "`n✅ Build completed! Ready for deployment" -ForegroundColor Green
