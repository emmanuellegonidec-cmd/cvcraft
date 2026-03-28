// patch-page.js — Exécuter avec: node patch-page.js
const fs = require('fs');
const path = 'app/dashboard/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const target = `      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),`;
const replacement = `      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),
      ...((newJob as any).company_description ? { company_description: (newJob as any).company_description } : {}),
      ...((newJob as any).company_website     ? { company_website: (newJob as any).company_website }         : {}),
      ...((newJob as any).company_size        ? { company_size: (newJob as any).company_size }               : {}),`;

if (content.includes('company_description')) {
  console.log('Deja patche — company_description existe deja dans page.tsx');
} else if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Succes ! saveJob mis a jour avec company_description, company_website, company_size');
} else {
  console.log('Ligne cible introuvable. Lignes avec newJob.favorite:');
  content.split('\n').forEach((line, i) => {
    if (line.includes('newJob.favorite')) console.log('  Ligne ' + (i+1) + ': ' + line.trim());
  });
}
