import os
import sys
import time
import subprocess

def main():
    exe_path = os.path.abspath("Vedika-Mascot.exe")
    print(f"Testing execution of: {exe_path}")
    if not os.path.exists(exe_path):
        print("Executable not found!")
        sys.exit(1)

    proc = subprocess.Popen([exe_path])
    print(f"Launched with PID: {proc.pid}. Waiting 6 seconds to ensure clean startup...")
    time.sleep(6)
    ret = proc.poll()
    if ret is None:
        print("[SUCCESS] Vedika-Mascot.exe is alive, stable, and running properly!")
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()
        print("[SUCCESS] Process terminated cleanly after test.")
        sys.exit(0)
    else:
        print(f"[FAILURE] Executable exited prematurely with code {ret}")
        sys.exit(ret)

if __name__ == "__main__":
    main()
