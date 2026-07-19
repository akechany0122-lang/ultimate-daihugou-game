import sys
# A simple script to try to parse the file or look for syntax errors.
import re
with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# Let's count braces in the script tag
script_match = re.search(r'<script type="text/babel">(.*?)</script>', text, re.DOTALL)
if script_match:
    script = script_match.group(1)
    open_braces = script.count('{')
    close_braces = script.count('}')
    print(f"Braces: {{ = {open_braces}, }} = {close_braces}")
    if open_braces != close_braces:
        print("MISMATCHED BRACES!")
else:
    print("No script tag found")
