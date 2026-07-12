import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update top-right-icon-buttons zIndex
old_top_right = """<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>"""
new_top_right = """<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 10000}}>"""
content = content.replace(old_top_right, new_top_right)

# 2. Update ProfileSettings Modal zIndex
old_profile = """<div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>"""
new_profile = """<div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>"""
# Note: This old_profile string matches both Profile and Leaderboard!
# We want to replace BOTH, so replacing all occurrences is correct.
content = content.replace(old_profile, new_profile)

# 3. Update Explanation Overlay zIndex
old_explanation = """{showExplanation && (
                <div className="explanation-overlay">"""
new_explanation = """{showExplanation && (
                <div className="explanation-overlay" style={{zIndex: 10000}}>"""
content = content.replace(old_explanation, new_explanation)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated z-indexes for top-right icons and modals")
