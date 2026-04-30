@echo off
cd /d E:\desktop\hecker
D:\python\python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000
