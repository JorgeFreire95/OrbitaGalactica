import os
import re

BRAIN_DIR = r"C:\Users\jorge\.gemini\antigravity\brain"

def search_password():
    if not os.path.exists(BRAIN_DIR):
        print("Brain dir not found")
        return

    for root, dirs, files in os.walk(BRAIN_DIR):
        for file in files:
            if file.endswith(".md") or file == "overview.txt":
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if "SUPERADMIN" in content:
                            print(f"Match in {path}:")
                            # Look for password-like patterns nearby
                            matches = re.findall(r"password[:\s]+(\S+)|contraseña[:\s]+(\S+)", content, re.IGNORECASE)
                            if matches:
                                for m in matches:
                                    print(f"  Possible password: {m}")
                            else:
                                # Print lines containing SUPERADMIN
                                for line in content.splitlines():
                                    if "SUPERADMIN" in line:
                                        print(f"  Line: {line}")
                except Exception:
                    continue

if __name__ == "__main__":
    search_password()
