# Creates the didaxis_dev GitHub environment and uploads DIDAXIS_* secrets from .env.
# Prerequisites: GitHub CLI installed and authenticated (`gh auth login`).

$ErrorActionPreference = "Stop"

$repo = "alex-lesley/AI-QA-Automation"
$environment = "didaxis_dev"
$envFile = Join-Path $PSScriptRoot "..\.env"

if (-not (Test-Path $envFile)) {
  throw "Missing .env file at $envFile"
}

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run: gh auth login"
}

$existingEnvironments = gh api "repos/$repo/environments" --jq ".environments[].name" 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Failed to list environments for $repo"
}

if ($existingEnvironments -contains $environment) {
  Write-Host "Environment '$environment' already exists."
} else {
  Write-Host "Creating GitHub environment '$environment'..."
  gh api --method PUT "repos/$repo/environments/$environment" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create environment '$environment'"
  }
}

$secrets = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) {
    return
  }
  if ($line -match '^(DIDAXIS_[A-Z0-9_]+)=(.*)$') {
    $name = $matches[1]
    $value = $matches[2].Trim()
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $secrets[$name] = $value
  }
}

if ($secrets.Count -eq 0) {
  throw "No DIDAXIS_* variables found in $envFile"
}

foreach ($entry in $secrets.GetEnumerator() | Sort-Object Name) {
  Write-Host "Setting environment secret $($entry.Name)..."
  $entry.Value | gh secret set $entry.Name --env $environment --repo $repo
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set secret $($entry.Name)"
  }
}

Write-Host "Done. Environment '$environment' is configured with $($secrets.Count) secret(s)."
