@echo off
echo PyInstaller 패키지를 설치합니다...
pip install pyinstaller

echo.
echo SmartSearchApp을 단일 실행 파일(exe)로 빌드합니다...
echo (이 작업은 1~3분 정도 소요될 수 있습니다.)
pyinstaller -w -F --add-data "templates;templates" --add-data "static;static" --add-data "modules;modules" --hidden-import pandas --hidden-import pptx --hidden-import yt_dlp --hidden-import win32com --hidden-import win32timezone app.py

echo.
echo 빌드가 완료되었습니다! 
echo 생생된 exe 파일은 'dist' 폴더 안에 있습니다.
pause
