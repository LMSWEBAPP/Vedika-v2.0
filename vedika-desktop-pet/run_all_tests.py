import os
import sys
import subprocess
import time

def run_test_module(name: str, script_path: str):
    print(f"\n{'='*60}")
    print(f"RUNNING SUITE: {name}")
    print(f"Script: {script_path}")
    print(f"{'='*60}")
    
    start_time = time.time()
    result = subprocess.run(
        [sys.executable, script_path],
        cwd=os.path.dirname(os.path.abspath(script_path)),
        capture_output=True,
        text=True
    )
    elapsed = time.time() - start_time
    
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print("[STDERR]:", result.stderr.strip())
        
    status = "PASSED" if result.returncode == 0 else "FAILED"
    print(f"\n--> {name}: [{status}] in {elapsed:.2f}s (exit code {result.returncode})")
    return result.returncode == 0

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    scratch_dir = os.path.abspath(os.path.join(base_dir, "..", "scratch"))
    
    suites = [
        ("Screen Capturer Unit Tests", os.path.join(base_dir, "test_screen_capturer.py")),
        ("Transparent Window & Interaction Tests", os.path.join(base_dir, "test_transparent_window.py")),
        ("Voice Modes & Clamping Tests", os.path.join(base_dir, "test_voice_modes_and_clamping.py")),
        ("Log System & Viewer Tests", os.path.join(base_dir, "test_log_system.py")),
        ("Isolated Mascot Integration Suite", os.path.join(base_dir, "test_mascot_isolated.py")),
        ("Global F9 Hold-to-Speak & Playback Suite", os.path.join(scratch_dir, "test_f9_global_hold_and_playback.py")),
        ("User Reported Fixes (Speech Capsule & PTT)", os.path.join(scratch_dir, "test_user_reported_fixes.py")),
    ]
    
    results = {}
    print(f"============================================================")
    print(f"VEDIKA DESKTOP MASCOT - AUTOMATED TEST RUNNER")
    print(f"Executing {len(suites)} test suites across all core subsystems")
    print(f"============================================================")
    
    all_passed = True
    for name, path in suites:
        if not os.path.exists(path):
            print(f"[SKIP] Script not found: {path}")
            continue
        passed = run_test_module(name, path)
        results[name] = passed
        if not passed:
            all_passed = False
            
    print(f"\n\n{'='*60}")
    print("FINAL TEST SUMMARY REPORT")
    print(f"{'='*60}")
    for name, passed in results.items():
        status_str = "[PASS]" if passed else "[FAIL]"
        print(f"  {status_str:<8} {name}")
        
    print(f"{'='*60}")
    if all_passed:
        print("ALL TEST SUITES EXECUTED AND PASSED WITH 100% SUCCESS!")
    else:
        print("ONE OR MORE TEST SUITES FAILED.")
    print(f"{'='*60}\n")
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
