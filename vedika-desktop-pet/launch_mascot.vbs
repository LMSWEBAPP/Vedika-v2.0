Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\25002\Desktop\v0.2\vedika-desktop-pet"
WshShell.Run "pythonw.exe main.py", 0, False
