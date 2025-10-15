# Azure Deployment Checklist

## Pre-Deployment

### 1. Azure Subscription Setup
- [ ] Create or access Azure subscription
- [ ] Note your subscription ID
- [ ] Ensure you have Owner or Contributor role

### 2. Azure CLI Installation
- [x] Install Azure CLI (completed)
- [x] Verify installation: `az --version`

### 3. Login to Azure
- [ ] Run: `az login --use-device-code`
- [ ] Copy device code
- [ ] Open: https://microsoft.com/devicelogin
- [ ] Enter device code
- [ ] Complete MFA authentication
- [ ] Verify: `az account show`

## Infrastructure Deployment

### 4. Deploy ARM Template
- [ ] Navigate to project directory: `cd c:\My_Stuff\development\apelamay`
- [ ] Run deployment script: `.\deploy-infrastructure-cli.ps1`
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Note the output URLs:
  - [ ] API URL: `https://apelamay-int-api.azurewebsites.net`
  - [ ] BFF URL: `https://apelamay-int-bff.azurewebsites.net`

### 5. Verify Resources Created
- [ ] Login to Azure Portal: https://portal.azure.com
- [ ] Navigate to Resource Group: `apelamay-int-rg`
- [ ] Verify 4 resources exist:
  - [ ] App Service Plan: `apelamay-int-plan`
  - [ ] API App Service: `apelamay-int-api`
  - [ ] BFF App Service: `apelamay-int-bff`
  - [ ] Application Insights: `apelamay-int-insights`

## Application Deployment

### 6. Deploy API Application
Choose one method:

#### Option A: Azure DevOps Pipeline
- [ ] Set up Azure DevOps project
- [ ] Create service connection
- [ ] Import `azure-pipelines-api.yml`
- [ ] Run pipeline

#### Option B: Manual Deployment
- [ ] Build API: `cd API && dotnet publish -c Release`
- [ ] Zip publish folder
- [ ] Deploy via Azure Portal or `az webapp deployment`

### 7. Deploy BFF Application
Choose one method:

#### Option A: Azure DevOps Pipeline
- [ ] Import `azure-pipelines-bff.yml`
- [ ] Run pipeline

#### Option B: Manual Deployment
- [ ] Build BFF: `cd BFF && dotnet publish -c Release`
- [ ] Zip publish folder
- [ ] Deploy via Azure Portal or `az webapp deployment`

## Configuration

### 8. Configure App Settings (Optional)
If you need these services, configure them in Azure Portal:

#### Cloudinary (Image Uploads)
- [ ] Get Cloudinary credentials
- [ ] Add `CloudinarySettings__CloudName`
- [ ] Add `CloudinarySettings__ApiKey`
- [ ] Add `CloudinarySettings__ApiSecret`

#### Resend (Email Service)
- [ ] Get Resend API token
- [ ] Add `Resend__ApiToken`

#### GitHub OAuth
- [ ] Register GitHub OAuth app
- [ ] Add `githubClientId`
- [ ] Configure callback URL

### 9. Configure CORS (if needed)
- [ ] Open API App Service in Azure Portal
- [ ] Navigate to "CORS" settings
- [ ] Add BFF URL: `https://apelamay-int-bff.azurewebsites.net`

## Testing

### 10. Test Deployments
- [ ] Visit API health endpoint: `https://apelamay-int-api.azurewebsites.net/health`
- [ ] Visit BFF URL: `https://apelamay-int-bff.azurewebsites.net`
- [ ] Test React application functionality
- [ ] Test API endpoints
- [ ] Check Application Insights for telemetry

### 11. Monitor Logs
- [ ] Check API logs: Azure Portal → API App → Log Stream
- [ ] Check BFF logs: Azure Portal → BFF App → Log Stream
- [ ] Check Application Insights for errors

## Post-Deployment

### 12. Configure Custom Domain (Optional)
- [ ] Purchase domain
- [ ] Configure DNS
- [ ] Add custom domain to BFF App Service
- [ ] Configure SSL certificate

### 13. Set Up Continuous Deployment
- [ ] Configure Azure DevOps pipelines
- [ ] Set up triggers for automatic deployment
- [ ] Test CI/CD pipeline

### 14. Security Hardening
- [ ] Enable managed identity
- [ ] Configure Azure Key Vault for secrets
- [ ] Review security recommendations
- [ ] Enable Azure Defender

## Troubleshooting

### Common Issues

#### "No subscriptions found"
- Ensure you have an active Azure subscription
- Your account needs proper permissions
- Wait for subscription provisioning to complete

#### "Deployment failed"
- Check error message in PowerShell output
- Verify resource names are unique globally
- Check Azure region supports all services
- Ensure you have permission to create resources

#### Application not responding
- Check App Service is running
- Review application logs
- Verify .NET 9.0 runtime is installed
- Check CORS settings

#### 500 Internal Server Error
- Check application logs
- Verify app settings are correct
- Check Application Insights for exceptions
- Ensure all dependencies are deployed

## Resource Locations

### Scripts
- `deploy-infrastructure-cli.ps1` - Deploy infrastructure
- `setup-azure-devops.ps1` - Set up Azure DevOps

### ARM Templates
- `azure-deploy.json` - Main infrastructure template

### Pipelines
- `azure-pipelines.yml` - Main pipeline
- `azure-pipelines-api.yml` - API deployment
- `azure-pipelines-bff.yml` - BFF deployment

### Documentation
- `DEPLOYMENT_COMPLETE.md` - Complete guide
- `SQL_SERVER_REMOVAL_SUMMARY.md` - Database removal info
- `WINDOWS_MIGRATION_SUMMARY.md` - Windows migration info
- `AZURE_DEPLOYMENT.md` - Deployment guide
- `ARM_TEMPLATE_GUIDE.md` - ARM template reference

## Cost Management

### Monthly Costs (Australia Southeast)
- App Service Plan (B1): ~$13 USD
- Application Insights: Free tier
- **Total: ~$13 USD/month**

### Cost Optimization
- [ ] Use F1 (Free) tier for development/testing
- [ ] Scale down when not in use
- [ ] Set up cost alerts
- [ ] Review Application Insights retention

## Contact & Support

### Getting Help
- Azure Support: https://portal.azure.com → Help + Support
- Azure Documentation: https://docs.microsoft.com/azure
- Pricing Calculator: https://azure.microsoft.com/pricing/calculator

### Current Configuration
- **Subscription**: (Your subscription)
- **Resource Group**: `apelamay-int-rg`
- **Location**: Australia Southeast
- **App Name Prefix**: `apelamay-int`
- **SKU**: B1 (Basic)

---

**Last Updated**: Generated after SQL Server removal
**Template Version**: Windows App Service, .NET 9.0, No Database
