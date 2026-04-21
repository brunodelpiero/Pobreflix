Get-ChildItem -Filter *.mkv | ForEach-Object {
    $input = $_.FullName
    $output = [System.IO.Path]::GetFileNameWithoutExtension($_.Name) + "_pt.mp4"

    Write-Host "Convertendo: $input → $output"

    ffmpeg -i "$input" `
    -map 0:v `
    -map 0:a:0 `
    -c:v copy `
    -c:a aac `
    "$output"
}

### powershell -ExecutionPolicy Bypass -File converter.ps1