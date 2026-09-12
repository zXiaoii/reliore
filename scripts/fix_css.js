const fs = require('fs');

let content = fs.readFileSync('c:/Users/charl/OneDrive/Desktop/work/src/globals.css', 'utf-8');

// Replace vercel-btn-primary
const primaryBtnGeist = 
.vercel-btn-primary {
  @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90;
};

content = content.replace(/\.vercel-btn-primary\s*{[^}]*}/, primaryBtnGeist);

// Replace vercel-btn-secondary
const secondaryBtnGeist = 
.vercel-btn-secondary {
  @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50;
};

content = content.replace(/\.vercel-btn-secondary\s*{[^}]*}/, secondaryBtnGeist);

// Replace custom-scrollbar to make it simpler and flatter
const scrollbarGeist = 
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-zinc-300 dark:bg-zinc-700 rounded-full;
};

content = content.replace(/\.custom-scrollbar::-webkit-scrollbar[^]*?\.custom-scrollbar::-webkit-scrollbar-thumb\s*{[^}]*}/, scrollbarGeist);

fs.writeFileSync('c:/Users/charl/OneDrive/Desktop/work/src/globals.css', content, 'utf-8');
