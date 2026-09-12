import re

with open('c:/Users/charl/OneDrive/Desktop/work/src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ternary class logic for tableDensity
content = re.sub(r"\$\{tableDensity === 'fit' \? '[^']*' : '([^']*)'\}", r"\1", content)

# Fix the shortCode logic
content = re.sub(r"shortCode=\{tableDensity === 'fit'\}", r"shortCode={false}", content)

# Remove the Fit Screen button logic completely
button_pattern = re.compile(r"<button[^>]*>\s*Fit Screen\s*</button>", re.MULTILINE | re.DOTALL)
content = button_pattern.sub("", content)

# Remove the divider line next to Fit Screen button
divider_pattern = re.compile(r'<div className="h-4 w-px bg-\[\#333333\] mx-1"></div>')
content = divider_pattern.sub("", content)

with open('c:/Users/charl/OneDrive/Desktop/work/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
