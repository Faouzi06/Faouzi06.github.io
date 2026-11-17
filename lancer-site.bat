@echo off
rem Double-cliquez sur ce fichier pour ouvrir le portfolio V2 dans votre navigateur.
rem Gardez la fenêtre noire ouverte tant que vous consultez le site.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serveur-local.ps1" -Port 8766
