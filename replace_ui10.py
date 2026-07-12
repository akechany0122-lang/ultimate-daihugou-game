import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Conditionally render title-card-fan based on titleStage === 1
start_marker = '<div className="title-card-fan">'
end_marker = '<div className="title-overlay"></div>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    # Wrap the block from start_idx up to end_idx with the condition
    block = content[start_idx:end_idx]
    
    # We need to make sure we don't break the JSX tree.
    # The title-card-fan is inside <div className="title-screen">
    # So we can just do {titleStage === 1 && ( <div className="title-card-fan"> ... </div> )}
    # Actually, let's just replace the exact block.
    
    # Find the closing </div> of title-card-fan
    # It is right before <div className="title-overlay"></div>
    # Let's inspect the exact lines from previous view_file:
    # 7708:                 })()}
    # 7709:               </div>
    # 7710:               <div className="title-overlay"></div>
    
    # Let's replace start_marker with "{titleStage === 1 && (\n              <div className=\"title-card-fan\">"
    # And replace "</div>\n              <div className=\"title-overlay\"></div>" with "</div>\n              )}\n              <div className=\"title-overlay\"></div>"
    
    new_content = content.replace(
        '<div className="title-card-fan">', 
        '{titleStage === 1 && (\n              <div className="title-card-fan">'
    )
    
    # To be safe and precise:
    old_end = '              </div>\n              <div className="title-overlay"></div>'
    new_end = '              </div>\n              )}\n              <div className="title-overlay"></div>'
    new_content = new_content.replace(old_end, new_end)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully hidden background cards on Stage 2")
else:
    print("Markers not found")
