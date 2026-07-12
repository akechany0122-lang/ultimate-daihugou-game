import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the stage2-background CSS to use the new oval_casino_table.jpg
content = content.replace("url('casino_table.jpg')", "url('oval_casino_table.jpg')")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated background image URL to oval_casino_table.jpg")
