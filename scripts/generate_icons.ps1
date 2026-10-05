Add-Type -AssemblyName System.Drawing

function Create-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    $g.Clear([System.Drawing.Color]::Transparent)

    $radius = [int]($size * 0.22)
    $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $pathObj.AddArc(0, 0, $d, $d, 180, 90)
    $pathObj.AddArc($size - $d, 0, $d, $d, 270, 90)
    $pathObj.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $pathObj.AddArc(0, $size - $d, $d, $d, 90, 90)
    $pathObj.CloseFigure()

    $p1 = New-Object System.Drawing.Point(0, 0)
    $p2 = New-Object System.Drawing.Point($size, $size)
    $c1 = [System.Drawing.Color]::FromArgb(255, 200, 75, 49)
    $c2 = [System.Drawing.Color]::FromArgb(255, 142, 40, 18)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($p1, $p2, $c1, $c2)
    $g.FillPath($brush, $pathObj)

    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 209, 102))
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    $baseW = [int]($size * 0.58)
    $baseH = [int]($size * 0.05)
    $baseX = [int](($size - $baseW) / 2)
    $baseY = [int]($size * 0.62)
    $g.FillRectangle($whiteBrush, $baseX, $baseY, $baseW, $baseH)

    $domeW = [int]($size * 0.50)
    $domeH = [int]($size * 0.32)
    $domeX = [int](($size - $domeW) / 2)
    $domeY = [int]($size * 0.32)
    $g.FillPie($goldBrush, $domeX, $domeY, $domeW, ($domeH * 2), 180, 180)

    $handleR = [int]($size * 0.05)
    $hx = [int](($size / 2) - $handleR)
    $hy = [int]($domeY - ($handleR * 1.5))
    $g.FillEllipse($whiteBrush, $hx, $hy, ($handleR * 2), ($handleR * 2))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $path"
}

Create-Icon 192 "icons/icon-192.png"
Create-Icon 512 "icons/icon-512.png"
