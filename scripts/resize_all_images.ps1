Add-Type -AssemblyName System.Drawing

$imgDir = "extracted recipes"
$files = Get-ChildItem -Path $imgDir -Filter "recipe_*_dish.jpg"
Write-Host "Found $($files.Count) dish images to resize."

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)

$maxDim = 640.0
$totalBefore = 0
$totalAfter = 0
$count = 0

foreach ($file in $files) {
    $srcPath = $file.FullName
    $tempPath = "$($file.FullName).tmp.jpg"
    $fileSizeBefore = $file.Length
    $totalBefore += $fileSizeBefore

    try {
        $orig = [System.Drawing.Image]::FromFile($srcPath)
        $origW = $orig.Width
        $origH = $orig.Height

        $ratio = [Math]::Min($maxDim / $origW, $maxDim / $origH)
        if ($ratio -ge 1.0) {
            # Already smaller than maxDim
            $orig.Dispose()
            $totalAfter += $fileSizeBefore
            continue
        }

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

        $bmp.Save($tempPath, $codec, $encoderParams)
        $bmp.Dispose()

        # Replace original
        Remove-Item $srcPath -Force
        Rename-Item $tempPath -NewName $file.Name

        $fileSizeAfter = (Get-Item $srcPath).Length
        $totalAfter += $fileSizeAfter
        $count++

        if ($count % 20 -eq 0 -or $count -eq $files.Count) {
            Write-Host "Resized $count / $($files.Count) images... Current total: $([Math]::Round($totalAfter / 1MB, 2)) MB"
        }
    } catch {
        Write-Host "Error resizing $($file.Name): $_"
        if (Test-Path $tempPath) { Remove-Item $tempPath -Force }
    }
}

Write-Host "Done! Successfully resized $count images."
Write-Host "Total size before: $([Math]::Round($totalBefore / 1MB, 2)) MB"
Write-Host "Total size after:  $([Math]::Round($totalAfter / 1MB, 2)) MB"
Write-Host "Saved:             $([Math]::Round(($totalBefore - $totalAfter) / 1MB, 2)) MB ($([Math]::Round((1 - ($totalAfter / $totalBefore)) * 100, 1))% reduction)"
