// patch-final.js — node patch-final.js
// Correction simple : utilise un ref pour capturer les infos entreprise
// avant que React ne mette à jour l'état
const fs = require('fs');
const path = 'app/dashboard/page.tsx';
let c = fs.readFileSync(path, 'utf8');

if (c.includes('extraJobFields')) {
  console.log('Deja patche'); process.exit(0);
}

// Ajouter le ref après les useState existants (après importLoading)
const A = `  const [importLoading, setImportLoading] = useState(false);`;
const B = `  const [importLoading, setImportLoading] = useState(false);
  // Ref pour capturer les infos entreprise de l'import fichier (contourne le timing async de setState)
  const extraJobFields = useRef<Record<string,string>>({});`;

if (!c.includes(A)) { console.log('ECHEC: importLoading introuvable'); process.exit(1); }
c = c.replace(A, B);

// Modifier le payload dans saveJob pour lire depuis extraJobFields.current
const OLD_FAV = `      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),`;

// Chercher avec les lignes company existantes ou sans
if (c.includes('company_description: (newJob as any)')) {
  // Déjà une version des champs company — remplacer par la version ref
  c = c.replace(
    /\/\/ Infos entreprise[\s\S]*?company_size.*?\{\},\n/,
    `      // Infos entreprise (import fichier) — via ref pour contourner le timing async
      ...(extraJobFields.current.company_description ? { company_description: extraJobFields.current.company_description } : {}),
      ...(extraJobFields.current.company_website     ? { company_website: extraJobFields.current.company_website }         : {}),
      ...(extraJobFields.current.company_size        ? { company_size: extraJobFields.current.company_size }               : {}),\n`
  );
} else {
  // Pas encore de champs company — ajouter après favorite
  const OLD_PAYLOAD_END = `      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),
    };`;
  const NEW_PAYLOAD_END = `      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),
      // Infos entreprise (import fichier) — via ref pour contourner le timing async
      ...(extraJobFields.current.company_description ? { company_description: extraJobFields.current.company_description } : {}),
      ...(extraJobFields.current.company_website     ? { company_website: extraJobFields.current.company_website }         : {}),
      ...(extraJobFields.current.company_size        ? { company_size: extraJobFields.current.company_size }               : {}),
    };`;
  if (!c.includes(OLD_PAYLOAD_END)) { console.log('ECHEC: fin payload introuvable'); process.exit(1); }
  c = c.replace(OLD_PAYLOAD_END, NEW_PAYLOAD_END);
}

// Réinitialiser le ref après sauvegarde
c = c.replace(
  `setJobs(prev => [data.job, ...prev]); setShowAddJob(false); setNewJob({ ...EMPTY_JOB });`,
  `setJobs(prev => [data.job, ...prev]); setShowAddJob(false); setNewJob({ ...EMPTY_JOB }); extraJobFields.current = {};`
);

// Passer onSetExtra à JobModal
c = c.replace(
  `onImport={importJobFromUrl} onSave={saveJob}`,
  `onImport={importJobFromUrl} onSave={saveJob} onSetExtra={(d: Record<string,string>) => { extraJobFields.current = d; }}`
);

fs.writeFileSync(path, c, 'utf8');
console.log('Succes ! extraJobFields.current utilise pour les infos entreprise');
