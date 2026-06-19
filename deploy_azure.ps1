# ============================================================
# Clinic OS — Azure Deployment Script (Cost-Effective)
# ============================================================
# Prerequisites:
#   1. Azure CLI installed (az --version)
#   2. Logged in (az login)
#   3. GitHub Personal Access Token with repo + workflow scopes
# ============================================================

# ---------- CONFIGURATION (Edit these values) ----------
$RESOURCE_GROUP   = "clinicos-rg"
$LOCATION         = "centralindia"
$DB_SERVER_NAME   = "clinicos-db"
$DB_NAME          = "clinic_db"
$DB_ADMIN_USER    = "clinicadmin"
$DB_ADMIN_PASS    = "ClinicOS@2026!Secure"   # CHANGE THIS! Min 8 chars, uppercase, lowercase, number, special char
$BACKEND_PLAN     = "clinicos-backend-plan"
$FRONTEND_PLAN    = "clinicos-frontend-plan"
$BACKEND_APP      = "clinicos-backend"
$FRONTEND_APP     = "clinicos-frontend"
$JWT_SECRET       = "clinic-os-jwt-secret-change-me-in-production-$(Get-Random -Maximum 999999)"
$GITHUB_REPO      = "stranger0407/ClinicSystem"
$GITHUB_BRANCH    = "deployment-one-doc"
# $GITHUB_TOKEN   = ""  # Set this or pass as parameter

# ---------- COLORS ----------
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    ⚠ $msg" -ForegroundColor Yellow }

# ============================================================
# STEP 0: Verify Azure CLI & Login
# ============================================================
Write-Step "Verifying Azure CLI..."
$azVersion = az --version 2>&1 | Select-Object -First 1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure CLI not found. Install from https://aka.ms/installazurecli"
    exit 1
}
Write-OK "Azure CLI: $azVersion"

Write-Step "Checking Azure login..."
$account = az account show --query "name" -o tsv 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Not logged in. Running 'az login'..."
    az login
}
Write-OK "Logged in to: $account"

# ============================================================
# STEP 1: Create Resource Group
# ============================================================
Write-Step "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create `
    --name $RESOURCE_GROUP `
    --location $LOCATION `
    --output none
Write-OK "Resource Group created"

# ============================================================
# STEP 2: Create PostgreSQL Flexible Server (Burstable B1ms)
# ============================================================
Write-Step "Creating PostgreSQL Flexible Server: $DB_SERVER_NAME (Burstable B1ms)..."
Write-Warn "This may take 3-5 minutes..."

az postgres flexible-server create `
    --resource-group $RESOURCE_GROUP `
    --name $DB_SERVER_NAME `
    --location $LOCATION `
    --admin-user $DB_ADMIN_USER `
    --admin-password $DB_ADMIN_PASS `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 15 `
    --public-access 0.0.0.0 `
    --yes `
    --output none

Write-OK "PostgreSQL Flexible Server created"

# Create the database
Write-Step "Creating database: $DB_NAME..."
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $DB_SERVER_NAME `
    --database-name $DB_NAME `
    --output none
Write-OK "Database created"

# Allow Azure services to access the database
Write-Step "Adding firewall rule: Allow Azure Services..."
az postgres flexible-server firewall-rule create `
    --resource-group $RESOURCE_GROUP `
    --name $DB_SERVER_NAME `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none
Write-OK "Firewall rule added"

# Build the DATABASE_URL
$DATABASE_URL = "postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASS}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"
Write-OK "DATABASE_URL constructed"

# ============================================================
# STEP 3: Create App Service Plans
# ============================================================
Write-Step "Creating Backend App Service Plan: $BACKEND_PLAN (Basic B1 Linux)..."
az appservice plan create `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_PLAN `
    --location $LOCATION `
    --sku B1 `
    --is-linux `
    --output none
Write-OK "Backend plan created"

Write-Step "Creating Frontend App Service Plan: $FRONTEND_PLAN (Free F1)..."
az appservice plan create `
    --resource-group $RESOURCE_GROUP `
    --name $FRONTEND_PLAN `
    --location $LOCATION `
    --sku F1 `
    --output none
Write-OK "Frontend plan created (Free tier, Windows)"

# ============================================================
# STEP 4: Create Web Apps
# ============================================================
Write-Step "Creating Backend Web App: $BACKEND_APP..."
az webapp create `
    --resource-group $RESOURCE_GROUP `
    --plan $BACKEND_PLAN `
    --name $BACKEND_APP `
    --runtime "NODE:20-lts" `
    --output none
Write-OK "Backend web app created"

Write-Step "Creating Frontend Web App: $FRONTEND_APP..."
az webapp create `
    --resource-group $RESOURCE_GROUP `
    --plan $FRONTEND_PLAN `
    --name $FRONTEND_APP `
    --runtime "NODE:20-lts" `
    --output none
Write-OK "Frontend web app created"

# ============================================================
# STEP 5: Configure App Settings (Environment Variables)
# ============================================================
$BACKEND_URL = "https://${BACKEND_APP}.azurewebsites.net"
$FRONTEND_URL = "https://${FRONTEND_APP}.azurewebsites.net"

Write-Step "Configuring Backend environment variables..."
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_APP `
    --settings `
        DATABASE_URL="$DATABASE_URL" `
        JWT_SECRET="$JWT_SECRET" `
        PORT=8080 `
        NODE_ENV=production `
        CORS_ORIGIN="https://${FRONTEND_APP}.azurewebsites.net" `
        WEBSITE_NODE_DEFAULT_VERSION="~20" `
    --output none
Write-OK "Backend env vars set"

Write-Step "Configuring Frontend environment variables..."
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $FRONTEND_APP `
    --settings `
        NEXT_PUBLIC_API_URL="$BACKEND_URL" `
        PORT=8080 `
        NODE_ENV=production `
        WEBSITE_NODE_DEFAULT_VERSION="~20" `
    --output none
Write-OK "Frontend env vars set"

# ============================================================
# STEP 6: Configure Startup Commands
# ============================================================
Write-Step "Setting Backend startup command..."
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_APP `
    --startup-file "node backend/dist/main.js" `
    --output none
Write-OK "Backend startup command set"

Write-Step "Setting Frontend startup command..."
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $FRONTEND_APP `
    --startup-file "node frontend/server.js" `
    --output none
Write-OK "Frontend startup command set"

# ============================================================
# STEP 7: Enable Always On for Backend
# ============================================================
Write-Step "Enabling Always On for Backend..."
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_APP `
    --always-on true `
    --output none
Write-OK "Always On enabled"

# ============================================================
# STEP 8: Configure CORS on Backend
# ============================================================
Write-Step "Configuring CORS on Backend..."
az webapp cors add `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_APP `
    --allowed-origins $FRONTEND_URL `
    --output none
Write-OK "CORS configured for $FRONTEND_URL"

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n" -NoNewline
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE! 🚀" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend URL: $FRONTEND_URL" -ForegroundColor White
Write-Host "  Backend URL:  $BACKEND_URL" -ForegroundColor White
Write-Host "  Database:     $DB_SERVER_NAME.postgres.database.azure.com" -ForegroundColor White
Write-Host ""
Write-Host "  Resource Group: $RESOURCE_GROUP" -ForegroundColor DarkGray
Write-Host "  Region:         $LOCATION" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Push the GitHub Actions workflows to 'deployment-one-doc' branch" -ForegroundColor Yellow
Write-Host "  2. Add these GitHub Secrets in repo settings:" -ForegroundColor Yellow
Write-Host "     - AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND" -ForegroundColor Yellow
Write-Host "     - AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND" -ForegroundColor Yellow
Write-Host "     - DATABASE_URL = $DATABASE_URL" -ForegroundColor Yellow
Write-Host "  3. Run Prisma migration:" -ForegroundColor Yellow
Write-Host "     DATABASE_URL='$DATABASE_URL' npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
