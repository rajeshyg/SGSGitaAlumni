import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_PATTERNS = [
  // Hardcoded hex colors
  /className="[^"]*bg-\[#[0-9a-fA-F]+\][^"]*"/g,
  /className="[^"]*text-\[#[0-9a-fA-F]+\][^"]*"/g,
  /className="[^"]*border-\[#[0-9a-fA-F]+\][^"]*"/g,
  
  // Hardcoded RGB/RGBA in className
  /className="[^"]*\[rgba?\([^)]+\)\][^"]*"/g,
  
  // Direct style with hex colors
  /style=\{\{[^}]*['"](#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))['"][^}]*\}\}/g,
  
  // Direct Tailwind color utilities (be careful - some might be intentional)
  /className="[^"]*(bg|text|border)-(red|blue|green|yellow|purple|pink|indigo|gray|slate)-(50|100|200|300|400|500|600|700|800|900)[^"]*"/g,
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];
  
  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const lineContent = lines[lineNumber - 1].trim();
      
      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: pattern.toString(),
        content: lineContent,
        match: match[0]
      });
    }
  });
  
  return violations;
}

function scanDirectory(dir, violations = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath, violations);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      const fileViolations = scanFile(filePath);
      violations.push(...fileViolations);
    }
  });
  
  return violations;
}

function generateReport() {
  const srcDir = path.join(__dirname, '..', 'src');
  console.log('🔍 Scanning for theme compliance violations...\n');
  
  const violations = scanDirectory(srcDir);
  
  if (violations.length === 0) {
    console.log('✅ SUCCESS: No theme compliance violations found!');
    console.log('All components are using theme variables correctly.\n');
    return true;
  }
  
  console.log(`❌ FAILED: Found ${violations.length} theme compliance violations:\n`);
  
  violations.forEach((v, index) => {
    console.log(`${index + 1}. ${v.file}:${v.line}`);
    console.log(`   Pattern: ${v.pattern}`);
    console.log(`   Code: ${v.content}`);
    console.log(`   Match: ${v.match}\n`);
  });
  
  return false;
}

const success = generateReport();
process.exit(success ? 0 : 1);
