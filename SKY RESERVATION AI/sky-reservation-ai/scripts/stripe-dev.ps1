# stripe-dev.ps1 — starts the Stripe webhook listener for local development.
# Run this in a separate terminal alongside `pnpm dev`.
# The signing secret is auto-captured and written to .env.local.

param(
    [string]$Port = "3000"
)

$stripe = "C:\Users\Hp\AppData\Local\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe"

if (-not (Test-Path $stripe)) {
    Write-Error "Stripe CLI not found at $stripe. Run: winget install Stripe.StripeCLI"
    exit 1
}

$envFile = Join-Path $PSScriptRoot "..\\.env.local"
$stripeKey = (Get-Content $envFile | Select-String "^STRIPE_SECRET_KEY=").ToString().Split("=", 2)[1]

if (-not $stripeKey) {
    Write-Error "STRIPE_SECRET_KEY not found in .env.local"
    exit 1
}

Write-Host "Starting Stripe webhook listener → http://localhost:$Port/api/billing/webhooks/stripe" -ForegroundColor Cyan

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $stripe
$psi.Arguments = "listen --api-key $stripeKey --forward-to localhost:$Port/api/billing/webhooks/stripe"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError  = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow  = $false

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
$proc.Start() | Out-Null

# Capture signing secret and update .env.local automatically
$secretCaptured = $false
while (-not $proc.HasExited) {
    $line = $proc.StandardError.ReadLine()
    if ($line) {
        Write-Host $line -ForegroundColor Gray
        if ($line -match "(whsec_[A-Za-z0-9]+)") {
            $secret = $Matches[1]
            if (-not $secretCaptured) {
                $content = Get-Content $envFile -Raw
                if ($content -match "STRIPE_WEBHOOK_SECRET=.*") {
                    $content = $content -replace "STRIPE_WEBHOOK_SECRET=.*", "STRIPE_WEBHOOK_SECRET=$secret"
                } else {
                    $content += "`nSTRIPE_WEBHOOK_SECRET=$secret"
                }
                Set-Content $envFile $content -NoNewline
                Write-Host "Webhook secret updated in .env.local: $secret" -ForegroundColor Green
                $secretCaptured = $true
            }
        }
    }
    $fwdLine = $proc.StandardOutput.ReadLine()
    if ($fwdLine) { Write-Host $fwdLine }
}
