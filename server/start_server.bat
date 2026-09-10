@echo off
rem Starts the Jewellery Shop cloud backup API on http://127.0.0.1:8000
rem Requires PHP (XAMPP at C:\xampp). Dependencies live in server\vendor.
setlocal
set "PHP=C:\xampp\php\php.exe"
set "SRV=%~dp0"
if not exist "%PHP%" (
  echo ERROR: PHP not found at %PHP%
  pause
  exit /b 1
)
if not exist "%SRV%.env" (
  copy "%SRV%.env.example" "%SRV%.env" >nul
  "%PHP%" "%SRV%artisan" key:generate
  "%PHP%" "%SRV%artisan" migrate --force
  "%PHP%" "%SRV%artisan" db:seed --class=ShopSeeder --force
)
echo Starting server on http://127.0.0.1:8000 -- press Ctrl+C to stop.
"%PHP%" "%SRV%artisan" serve --host=127.0.0.1 --port=8000
endlocal