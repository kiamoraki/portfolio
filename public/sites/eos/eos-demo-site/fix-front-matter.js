const fs = require('fs');
const path = require('path');

// List all .html files in the current directory
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Check if front matter is already properly formatted
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);

    if (frontMatterMatch) {
        const yamlContent = frontMatterMatch[1];
        // Check if YAML is properly formatted (each field on its own line)
        const lines = yamlContent.split('\n').filter(line => line.trim());
        const isProperlyFormatted = lines.every(line =>
            line.includes(':') && !line.includes('layout: wrapper title:')
        );

        if (isProperlyFormatted) {
            console.log(`Skipping ${file} - already properly formatted`);
            return;
        }
    }

    // Remove all existing front matter blocks
    let body = content.replace(/(^---[\s\S]*?---\s*)+/m, '');

    // Build new front matter with proper formatting
    let newYaml = [];

    // Try to extract from the first block if present
    const match = content.match(/^---[\s\S]*?---/);
    if (match) {
        const yamlLines = match[0].split('\n').filter(Boolean);
        yamlLines.forEach(line => {
            if (line.trim().startsWith('layout:')) {
                newYaml.push(`layout: ${line.split(':')[1].trim()}`);
            } else if (line.trim().startsWith('title:')) {
                newYaml.push(`title: ${line.split(':')[1].trim()}`);
            }
        });
    }

    // Add defaults if not present
    if (!newYaml.find(l => l.startsWith('layout:'))) {
        newYaml.unshift('layout: wrapper');
    }
    if (!newYaml.find(l => l.startsWith('title:'))) {
        newYaml.push('title: Untitled');
    }

    // Format with proper spacing
    const newFrontMatter = `---\n${newYaml.join('\n')}\n---\n\n`;
    const fixed = newFrontMatter + body.replace(/^\s+/, '');

    if (fixed !== content) {
        fs.writeFileSync(file, fixed, 'utf8');
        console.log(`Fixed: ${file}`);
    } else {
        console.log(`No changes needed: ${file}`);
    }
});