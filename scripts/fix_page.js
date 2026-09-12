const fs = require('fs');

let content = fs.readFileSync('c:/Users/charl/OneDrive/Desktop/work/src/app/page.tsx', 'utf-8');

// Replace ternary class logic for tableDensity
content = content.replace(/\$\{tableDensity === 'fit' \? '[^']*' : '([^']*)'\}/g, "");

// Fix the shortCode logic
content = content.replace(/shortCode=\{tableDensity === 'fit'\}/g, "shortCode={false}");

// Remove the Fit Screen button logic completely
content = content.replace(/<button[^>]*>\s*Fit Screen\s*<\/button>/gm, "");

// Remove the divider line next to Fit Screen button
content = content.replace(/<div className="h-4 w-px bg-\[#333333\] mx-1"><\/div>/g, "");

fs.writeFileSync('c:/Users/charl/OneDrive/Desktop/work/src/app/page.tsx', content, 'utf-8');
