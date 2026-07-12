import sys

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_block(start_str):
    start_idx = -1
    for i, line in enumerate(lines):
        if start_str in line:
            start_idx = i
            break
    if start_idx == -1: return -1, -1
    
    brace_count = 0
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0:
            return start_idx, i
    return -1, -1

b1_s, b1_e = find_block('{!gameStarted && (<div className="top-right-icon-buttons"')
b2_s, b2_e = find_block('{showProfileSettings && (')
b3_s, b3_e = find_block('{showLeaderboard && (')
b4_s, b4_e = find_block('{showExplanation && (')

if b1_s == -1 or b2_s == -1 or b3_s == -1 or b4_s == -1:
    print("Error: Could not find all blocks")
    sys.exit(1)

# Extract blocks
block1 = lines[b1_s-1:b1_e+1] # include the comment above it maybe? let's just do b1_s
if '/*' in lines[b1_s-1]:
    b1_s -= 1
block1 = lines[b1_s:b1_e+1]

# We need to extract them from bottom to top so indices don't shift, 
# or just gather all indices to delete and rebuild the file.
indices_to_delete = set()
for i in range(b1_s, b1_e+1): indices_to_delete.add(i)
for i in range(b2_s, b2_e+1): indices_to_delete.add(i)
for i in range(b3_s, b3_e+1): indices_to_delete.add(i)
for i in range(b4_s, b4_e+1): indices_to_delete.add(i)

# The blocks content
extracted_blocks = []
extracted_blocks.extend(lines[b1_s:b1_e+1])
extracted_blocks.append('\n')
extracted_blocks.extend(lines[b2_s:b2_e+1])
extracted_blocks.append('\n')
extracted_blocks.extend(lines[b3_s:b3_e+1])
extracted_blocks.append('\n')
extracted_blocks.extend(lines[b4_s:b4_e+1])
extracted_blocks.append('\n')

new_lines = []
for i, line in enumerate(lines):
    if i in indices_to_delete:
        continue
    
    # Insert right before the closing div of game-root
    if '</div>' in line and i > 8850 and ')}' in lines[i-1]:
        # found the end of the ternary
        new_lines.extend(extracted_blocks)
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully moved top-right icons and modals to the end of game-container")
