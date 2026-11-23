[CmdletBinding()]
param([string]$OutputDirectory = (Join-Path $PSScriptRoot '..\dist'))
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$extension = Join-Path $project 'Erweiterung'
$version = (Get-Content -Raw -Encoding UTF8 (Join-Path $extension 'manifest.json') | ConvertFrom-Json).version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Ungültige Versionsnummer.' }
$output = [IO.Directory]::CreateDirectory($OutputDirectory).FullName
$setup = Join-Path $output "TreeHugger-$version-Setup.exe"
$temp = [IO.Directory]::CreateDirectory((Join-Path ([IO.Path]::GetTempPath()) ('treehugger-build-' + [guid]::NewGuid()))).FullName
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = Join-Path $temp 'payload.zip'
    [IO.Compression.ZipFile]::CreateFromDirectory($extension, $zip, [IO.Compression.CompressionLevel]::Optimal, $false)
    $digest = Join-Path $temp 'payload.sha256'
    [IO.File]::WriteAllText($digest, (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant())
    $metadata = Join-Path $temp 'version.cs'
    [IO.File]::WriteAllText($metadata, ('[assembly:System.Reflection.AssemblyVersion("{0}.0")]' -f $version))
    $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
    $built = Join-Path $temp 'Setup.exe'
    & $compiler /nologo /target:winexe /platform:anycpu /optimize+ /codepage:65001 "/out:$built" "/resource:$zip,payload.zip" "/resource:$digest,payload.sha256" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll (Join-Path $PSScriptRoot 'Setup.cs') $metadata
    if ($LASTEXITCODE -ne 0) { throw 'Der C#-Compiler konnte das Setup nicht erstellen.' }
    Copy-Item -LiteralPath $built -Destination $setup -Force
    $checksum = (Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + [IO.Path]::GetFileName($setup)
    [IO.File]::WriteAllText((Join-Path $output "TreeHugger-$version-SHA256.txt"), $checksum + [Environment]::NewLine)
    Write-Output $setup
} finally {
    if ((Split-Path $temp -Leaf) -like 'treehugger-build-*' -and (Split-Path $temp -Parent).TrimEnd('\') -eq ([IO.Path]::GetTempPath()).TrimEnd('\')) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
