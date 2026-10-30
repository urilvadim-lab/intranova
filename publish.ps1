# Публикация сайта на GitHub Pages.
# Запуск: правый клик по файлу → «Выполнить с помощью PowerShell».
# Использует вход в GitHub, сохранённый ранее (зашифрован под вашу учётку Windows).
# Сеть до GitHub бывает нестабильной, поэтому все запросы повторяются при обрывах.
$d = "$env:LOCALAPPDATA\devtools"
$env:Path = "$d\git\cmd;$env:Path"
[Net.ServicePointManager]::SecurityProtocol = 'Tls12'
Set-Location $PSScriptRoot

$sec = Get-Content "$d\gh-token.sec" | ConvertTo-SecureString
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$hdr = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json"; "X-GitHub-Api-Version" = "2022-11-28" }

function Api($method, $path, $body) {
  for ($i = 0; $i -lt 15; $i++) {
    try {
      $req = @{ Method = $method; Uri = "https://api.github.com$path"; Headers = $hdr; TimeoutSec = 40 }
      if ($body) { $req.Body = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json)); $req.ContentType = "application/json; charset=utf-8" }
      return Invoke-RestMethod @req
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -and $code -ne 502 -and $code -ne 503) { throw "HTTP $code $path" }
      Start-Sleep 4
    }
  }
  throw "нет связи с GitHub ($path)"
}

try {
  $user = (Api GET "/user").login
  Write-Host "Аккаунт: $user"

  try { Api GET "/repos/$user/intranova" | Out-Null; Write-Host "Репозиторий уже есть" }
  catch {
    Api POST "/user/repos" @{ name = "intranova"; description = "Сайт интенсива по психосоматике — intranova.ru"; private = $false } | Out-Null
    Write-Host "Репозиторий создан"
  }

  git remote remove origin 2>$null
  git remote add origin "https://github.com/$user/intranova.git"
  $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
  $ok = $false
  for ($i = 0; $i -lt 8 -and -not $ok; $i++) {
    git -c http.extraheader="AUTHORIZATION: basic $b64" push -u origin main 2>&1 | Out-Null
    $ok = $LASTEXITCODE -eq 0
    if (-not $ok) { Write-Host "Повтор отправки кода..."; Start-Sleep 5 }
  }
  if (-not $ok) { throw "не удалось отправить код" }
  Write-Host "Код отправлен"

  try { Api POST "/repos/$user/intranova/pages" @{ build_type = "workflow" } | Out-Null } catch {}
  Api PUT "/repos/$user/intranova/pages" @{ build_type = "workflow"; cname = "intranova.ru" } | Out-Null
  Write-Host "GitHub Pages включён, домен intranova.ru привязан"
  try { Api POST "/repos/$user/intranova/actions/workflows/deploy.yml/dispatches" @{ ref = "main" } | Out-Null } catch {}

  Write-Host ""
  Write-Host "ГОТОВО. Сборка сайта: https://github.com/$user/intranova/actions" -ForegroundColor Green
  Write-Host "Напишите Claude «опубликовал» — он настроит DNS в Beget."
} catch {
  Write-Host "ОШИБКА: $_" -ForegroundColor Red
  Write-Host "Запустите скрипт ещё раз — чаще всего это обрыв связи."
}
Read-Host "Нажмите Enter, чтобы закрыть"
