const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const dir = path.join(__dirname, 'src');
walkSync(dir, function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const newContent = content
        .replace(/\btext-white\b/g, 'text-foreground')
        .replace(/\btext-white\/(\d+)\b/g, 'text-foreground/$1')
        .replace(/\bbg-white\/(\d+)\b/g, 'bg-foreground/$1')
        .replace(/\bborder-white\/(\d+)\b/g, 'border-foreground/$1')
        .replace(/\bdecoration-white\/(\d+)\b/g, 'decoration-foreground/$1');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed:', filePath);
    }
});
