import subprocess, sys

tests = [
    "test_auth.py",
    "test_groups_subs.py",
    "test_booking_conflict.py",
    "test_recommend.py",
    "test_notifications.py",
    "test_admin.py",
    "test_e2e.py",
]

all_pass = True
for t in tests:
    result = subprocess.run([sys.executable, t], capture_output=True, text=True)
    output = result.stdout + result.stderr
    # Filter relevant last lines
    lines = [l for l in output.splitlines() if l.strip() and "DATABASE" not in l and "PyMySQL" not in l and "sqlalche" not in l and "NOTICE" not in l]
    last = "\n".join(lines[-4:])
    status = "PASS" if result.returncode == 0 else "FAIL"
    if result.returncode != 0:
        all_pass = False
    print(f"[{status}] {t}")
    if result.returncode != 0:
        print(f"  ERROR OUTPUT:\n{last}\n")
    else:
        # Print last success line
        success_lines = [l for l in lines if "SUCCESS" in l or "VERIFIED" in l]
        if success_lines:
            print(f"  {success_lines[-1]}")

print()
print("ALL TESTS PASSED" if all_pass else "SOME TESTS FAILED")
