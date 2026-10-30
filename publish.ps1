# Публикация сайта на GitHub Pages.
# Запуск: правый клик по файлу → «Выполнить с помощью PowerShell».
# Скрипт попросит подтвердить вход в GitHub в браузере — это нужно сделать один раз.
$ErrorActionPreference = "Stop"
$d = "$env:LOCALAPPDATA\devtools"
$env:Path = "$d\node-v22.11.0-win-x64;$d\git\cmd;$d\gh\bin;$env:Path"
Set-Location $PSScriptRoot

$repo = "intranova"

gh auth status 2>$null
if (-not $?) {
  Write-Host "Сейчас откроется вход в GitHub. Скопируйте код, вставьте его на странице и нажмите Authorize." -ForegroundColor Yellow
  gh auth login --hostname github.com --git-protocol https --web --scopes "repo,workflow"
}
gh auth setup-git

$user = gh api user --jq .login
$exists = $true
try { gh repo view "$user/$repo" *> $null } catch { $exists = $false }
if (-not $exists -or -not $?) {
  gh repo create $repo --public --source . --remote origin --description "Сайт интенсива по психосоматике — intranova.ru"
} elseif (-not (git remote | Select-String origin)) {
  git remote add origin "https://github.com/$user/$repo.git"
}
git push -u origin main

# Включаем Pages со сборкой через GitHub Actions и привязываем домен
try { gh api -X POST "repos/$user/$repo/pages" -f build_type=workflow *> $null } catch {}
gh api -X PUT "repos/$user/$repo/pages" -f cname=intranova.ru -f build_type=workflow

Write-Host ""
Write-Host "Готово. Сборка идёт тут: https://github.com/$user/$repo/actions" -ForegroundColor Green
Write-Host "Осталось DNS в Beget: A-записи @ → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME www → $user.github.io"
Read-Host "Нажмите Enter, чтобы закрыть"
