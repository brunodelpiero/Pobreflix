Get-ChildItem -File | Where-Object {
    $_.Extension -match "\.(mkv|mp4|avi)$" -and
    $_.Name -notmatch "_final"
} | ForEach-Object {

    $input = $_.FullName
    $name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $output = "$name`_final.mp4"

    Write-Host "==============================="
    Write-Host "Processando: $($_.Name)"
    Write-Host "Saída: $output"

    # tenta pegar áudio em português
    ffmpeg -i "$input" `
    -map 0:v `
    -map 0:a:m:language:por? `
    -map 0:a:0? `
    -c:v copy `
    -c:a aac `
    -ac 2 `
    -b:a 192k `
    -movflags +faststart `
    "$output"

    Write-Host "Finalizado: $output"
}