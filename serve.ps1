# Simple Static HTTP Server in PowerShell
$port = 8080
$path = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "SikadTPA berjalan di http://localhost:$port/"
    Write-Host "Tekan Ctrl+C untuk berhenti."
} catch {
    Write-Host "Error starting listener: $_"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) {
            $localPath = "index.html"
        }
        
        $filePath = Join-Path $path $localPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css" }
                ".js"   { $contentType = "application/javascript" }
                ".json" { $contentType = "application/json" }
                ".png"  { $contentType = "image/png" }
                ".svg"  { $contentType = "image/svg+xml" }
            }
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            try {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                # Ignore client connection resets
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $msg.Length
            try {
                $response.OutputStream.Write($msg, 0, $msg.Length)
            } catch { }
        }
        try {
            $response.Close()
        } catch { }
    } catch {
        Start-Sleep -Milliseconds 20
    }
}
