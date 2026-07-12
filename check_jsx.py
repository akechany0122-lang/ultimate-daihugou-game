import re
import sys

def check_jsx_brackets(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # <script type="text/babel"> の中身だけを抽出
    match = re.search(r'<script type="text/babel".*?>(.*?)</script>', content, re.DOTALL)
    if not match:
        print("JSX script block not found.")
        return

    jsx_code = match.group(1)
    
    # 簡単な括弧カウンタ
    counts = {'{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0}
    lines = jsx_code.split('\n')
    
    for i, line in enumerate(lines):
        for char in line:
            if char in counts:
                counts[char] += 1
                
    print("Bracket counts:", counts)
    if counts['{'] != counts['}']:
        print("Mismatch in {} !")
    if counts['('] != counts[')']:
        print("Mismatch in () !")
    if counts['['] != counts[']']:
        print("Mismatch in [] !")

if __name__ == "__main__":
    check_jsx_brackets(sys.argv[1])
