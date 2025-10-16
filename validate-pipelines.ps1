# Validate Azure Pipelines YAML files
# This script checks for basic YAML syntax errors

param(
    [Parameter(Mandatory=$false)]
    [string[]]$Files = @("azure-pipelines-api.yml", "azure-pipelines-bff.yml", "azure-pipelines-combined.yml")
)

Write-Host "======================================"
Write-Host "Azure Pipelines YAML Validator" -ForegroundColor Cyan
Write-Host "======================================"
Write-Host ""

# Function to validate YAML syntax
function Test-YamlSyntax {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  [SKIP] File not found: $FilePath" -ForegroundColor Yellow
        return $false
    }

    Write-Host "Validating: $FilePath" -ForegroundColor Cyan
    
    try {
        # Read file content
        $content = Get-Content $FilePath -Raw
        
        # Basic checks
        $issues = @()
        
        # Check 1: No tabs (YAML requires spaces)
        if ($content -match "`t") {
            $issues += "  [ERROR] Contains TAB characters (use spaces only)"
        }
        
        # Check 2: Consistent indentation (2 spaces)
        $lines = Get-Content $FilePath
        $lineNumber = 0
        foreach ($line in $lines) {
            $lineNumber++
            if ($line -match '^( +)' -and ($line -notmatch '^( {2})*[^ ]')) {
                # Indentation is not a multiple of 2
                $spaces = $matches[1].Length
                if ($spaces % 2 -ne 0) {
                    $issues += "  [WARNING] Line $lineNumber : Odd indentation ($spaces spaces)"
                }
            }
        }
        
        # Check 3: No trailing whitespace on YAML keys
        $lineNumber = 0
        foreach ($line in $lines) {
            $lineNumber++
            if ($line -match ':\s+$' -and $line -notmatch '^\s*#') {
                $issues += "  [WARNING] Line $lineNumber : Trailing whitespace after ':'"
            }
        }
        
        # Check 4: Proper list syntax
        $lineNumber = 0
        foreach ($line in $lines) {
            $lineNumber++
            # Check for list items that should have a space after dash
            if ($line -match '^\s*-[^\s]' -and $line -notmatch '^\s*---') {
                $issues += "  [ERROR] Line $lineNumber : Missing space after '-'"
            }
        }
        
        # Check 5: Basic Azure Pipelines structure
        if ($content -notmatch 'trigger:') {
            $issues += "  [WARNING] No 'trigger:' section found"
        }
        if ($content -notmatch 'stages:|jobs:|steps:') {
            $issues += "  [ERROR] No 'stages:', 'jobs:', or 'steps:' found"
        }
        
        # Check 6: Common Azure Pipelines tasks
        $taskPattern = '- task:'
        if ($content -match $taskPattern) {
            # Check for proper task format
            $lineNumber = 0
            foreach ($line in $lines) {
                $lineNumber++
                if ($line -match '^\s*- task:') {
                    $nextLine = $lines[$lineNumber]
                    if ($nextLine -and $nextLine -notmatch '^\s+(displayName|inputs):') {
                        $issues += "  [WARNING] Line $lineNumber : Task should be followed by 'displayName' or 'inputs'"
                    }
                }
            }
        }
        
        # Report results
        if ($issues.Count -eq 0) {
            Write-Host "  [OK] No issues found!" -ForegroundColor Green
            Write-Host ""
            return $true
        } else {
            Write-Host "  Found $($issues.Count) issue(s):" -ForegroundColor Yellow
            foreach ($issue in $issues) {
                Write-Host $issue -ForegroundColor $(if ($issue -match 'ERROR') { 'Red' } else { 'Yellow' })
            }
            Write-Host ""
            return $false
        }
        
    } catch {
        Write-Host "  [ERROR] Failed to parse file: $_" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Validate all files
$allValid = $true
foreach ($file in $Files) {
    $isValid = Test-YamlSyntax -FilePath $file
    if (-not $isValid) {
        $allValid = $false
    }
}

Write-Host "======================================"
if ($allValid) {
    Write-Host "All pipeline files are valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some pipeline files have issues!" -ForegroundColor Red
    exit 1
}
