Add-Type -AssemblyName System.Drawing

$outDir = "extracted recipes"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$bmp = New-Object System.Drawing.Bitmap(640, 640)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Soft pastel pink background
$pink = [System.Drawing.Color]::FromArgb(255, 248, 187, 208)
$g.Clear($pink)

# Centered bold letters 'L.G.'
$font = New-Object System.Drawing.Font('Arial', 120, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 173, 20, 87))
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, 640, 640)
$g.DrawString('L.G.', $font, $brush, $rect, $format)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)

$masterPath = "$outDir/recipe_new_placeholder.jpg"
$bmp.Save($masterPath, $codec, $encoderParams)
$g.Dispose()
$bmp.Dispose()
Write-Host "Created master placeholder: $masterPath"

# Copy to recipe_193_dish.jpg ... recipe_247_dish.jpg
for ($i = 193; $i -le 247; $i++) {
    $targetName = "recipe_$($i)_dish.jpg"
    $targetPath = "$outDir/$targetName"
    Copy-Item $masterPath -Destination $targetPath -Force
}
Remove-Item $masterPath -Force
Write-Host "Successfully generated 55 dish images (recipe_193_dish.jpg through recipe_247_dish.jpg)."
