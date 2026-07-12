import re
import sys

def check_jsx_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'<script type="text/babel".*?>(.*?)</script>', content, re.DOTALL)
    if not match:
        print("JSX script block not found.")
        return

    jsx_code = match.group(1)
    
    # 非常に簡易的なタグチェッカー
    # 文字列の中やコメントの中のタグも拾ってしまうが、大まかなチェックにはなる
    
    # まずコメントを削除
    jsx_code = re.sub(r'//.*', '', jsx_code)
    jsx_code = re.sub(r'/\*.*?\*/', '', jsx_code, flags=re.DOTALL)
    
    # 開始タグと終了タグを抽出
    # <div ...>, </div>, <button ...>, </button>
    tags = re.findall(r'</?([a-zA-Z0-9]+)[^>]*>', jsx_code)
    
    stack = []
    for tag in tags:
        # self-closing tag は抽出時に / がタグ名の前に来ないため、元文字列を見て判断する必要がある
        # 少し複雑なので、単に <tag> と </tag> の出現回数をカウントして差分を見る
        pass
        
    # 各タグのカウント
    opening = {}
    closing = {}
    
    for m in re.finditer(r'<([a-zA-Z0-9]+)(?:[^>]*)>', jsx_code):
        tag = m.group(1)
        # self-closing check: /> で終わっているか
        if m.group(0).endswith('/>'):
            continue
        opening[tag] = opening.get(tag, 0) + 1
        
    for m in re.finditer(r'</([a-zA-Z0-9]+)>', jsx_code):
        tag = m.group(1)
        closing[tag] = closing.get(tag, 0) + 1
        
    all_tags = set(opening.keys()).union(set(closing.keys()))
    for tag in all_tags:
        o = opening.get(tag, 0)
        c = closing.get(tag, 0)
        if tag in ['img', 'input', 'br', 'hr']: # self-closing
            continue
        if o != c:
            print(f"Mismatch for <{tag}>: opening {o}, closing {c}")

if __name__ == "__main__":
    check_jsx_tags(sys.argv[1])
