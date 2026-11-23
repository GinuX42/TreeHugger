[CmdletBinding()]
param([Parameter(Mandatory)][string]$SetupPath)
$ErrorActionPreference = 'Stop'
$setup = (Resolve-Path -LiteralPath $SetupPath).Path
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\Erweiterung')).Path
$testRoot = [IO.Directory]::CreateDirectory((Join-Path ((Split-Path $setup -Parent)) ('treehugger-test-' + [guid]::NewGuid()))).FullName
$target = Join-Path $testRoot 'Installiert mit Leerzeichen'
$installed = Join-Path $target 'Erweiterung'

function Invoke-Setup([string]$Operation, [int]$Expected = 0) {
    $process = Start-Process -FilePath $setup -ArgumentList @($Operation, ('"' + $target + '"')) -WindowStyle Hidden -PassThru -Wait -RedirectStandardError (Join-Path $testRoot 'setup-error.txt')
    if ($process.ExitCode -ne $Expected) { throw "Setup $Operation lieferte $($process.ExitCode), erwartet $Expected. $(Get-Content -Raw -LiteralPath (Join-Path $testRoot 'setup-error.txt'))" }
}
function Compare-Installation {
    $expected = @(Get-ChildItem -LiteralPath $source -File -Recurse -Force)
    $actual = @(Get-ChildItem -LiteralPath $installed -File -Recurse -Force | Where-Object Name -ne '.treehugger-install')
    if ($actual.Count -ne $expected.Count) { throw "Anzahl installierter Dateien stimmt nicht." }
    foreach ($entry in $expected) {
        $relative = $entry.FullName.Substring($source.Length + 1)
        $hash = (Get-FileHash -LiteralPath (Join-Path $installed $relative)).Hash
        if ($hash -ne (Get-FileHash -LiteralPath $entry.FullName).Hash) { throw "Datei weicht ab: $relative" }
    }
    Write-Output "$($actual.Count) installierte Dateien bytegleich."
}
try {
    Invoke-Setup '--install'
    Compare-Installation
    Invoke-Setup '--install'
    Compare-Installation
    $own = Join-Path $installed 'eigene-notiz.txt'
    [IO.File]::WriteAllText($own, 'eigene Daten')
    Invoke-Setup '--install' 1
    Invoke-Setup '--uninstall' 1
    if ([IO.File]::ReadAllText($own) -ne 'eigene Daten') { throw 'Fremde Datei verändert.' }
    Remove-Item -LiteralPath $own
    Invoke-Setup '--uninstall'
    if (Test-Path -LiteralPath $installed) { throw 'Erweiterungsordner nach Deinstallation vorhanden.' }
    Invoke-Setup '--uninstall'
    Write-Output 'Installation, erneute Installation, Fremddateischutz und Deinstallation bestanden.'
} finally {
    if ((Split-Path $testRoot -Leaf) -like 'treehugger-test-*' -and (Split-Path $testRoot -Parent).TrimEnd('\') -eq ((Split-Path $setup -Parent)).TrimEnd('\')) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}
