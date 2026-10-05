Add-Type -AssemblyName System.Drawing

$srcPath = "extracted recipes/recipe_01_dish.jpg"
$orig = [System.Drawing.Image]::FromFile($srcPath)
$origW = $orig.Width
$origH = $orig.Height

$maxDim = 720.0
$ratio = [Math]::Min($maxDim / $origW, $maxDim / $origH)
$newW = [int]($origW * $ratio)
$newH = [int]($origH * $ratio)

$bmp = New-Object System.Drawing.Bitmap($newW, $newH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.DrawImage($orig, 0, 0, $newW, $newH)
$orig.Dispose()
$g.Dispose()

# JPEG encoder with quality 80
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)

$testDest = "scripts/test_resized.jpg"
$bmp.Save($testDest, $codec, $encoderParams)
$bmp.Dispose()

$origSize = (Get-Item $srcPath).Length
$newSize = (Get-Item $testDest).Length
Write-Host "Original: ${origW}x${origH}, $origSize bytes"
Write-Host "Resized:  ${newW}x${newH}, $newSize bytes ($([Math]::Round($newSize / 1024, 1)) KB)"
Write-Host "Reduction: $([Math]::Round((1 - ($newSize / $origSize)) * 100, 1))%"
