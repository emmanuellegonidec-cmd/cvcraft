import Link from "next/link";

export const metadata = {
  title: "Mentions legales - Extension Chrome | Jean find my Job",
  description:
    "Mentions legales de l'extension Chrome Jean find my Job : editeur, hebergement, propriete intellectuelle, donnees personnelles et conditions d'utilisation.",
};

const FONT = "Montserrat, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const RED = "#E8151B";
const BLACK = "#111";
const YELLOW = "#F5C400";
const GRAY_BG = "#FAFAFA";

export default function ExtensionMentionsLegalesPage() {
  return (
    <div style={{ background: "#fff", color: BLACK, fontFamily: FONT, minHeight: "100vh" }}>
      <header style={{ padding: "2rem 3rem", borderBottom: "2.5px solid #111", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: BLACK, textDecoration: "none", padding: "8px 14px", border: "2px solid #111", boxShadow: "3px 3px 0 #111", display: "inline-block" }}>
            Retour a l&apos;accueil
          </Link>
          <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
            Derniere mise a jour : 26 avril 2026
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 3rem 5rem" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: "0.5rem", letterSpacing: "-1px" }}>
          Mentions legales - Extension Chrome
        </h1>

        <p style={{ fontSize: 16, color: "#555", marginBottom: "3rem", lineHeight: 1.6 }}>
          La presente page concerne specifiquement l&apos;extension Chrome <strong>Jean find my Job</strong>, actuellement en cours de developpement. Elle complete les{" "}
          <Link href="/mentions-legales" style={{ color: RED, fontWeight: 700 }}>
            mentions legales generales du site
          </Link>{" "}
          et sera mise a jour a la mise en ligne publique de l&apos;extension sur le Chrome Web Store.
        </p>

        <Section title="1. Editeur de l'extension">
          <p>L&apos;extension Chrome <strong>Jean find my Job</strong> est editee par :</p>
          <Box>
            <strong>GONIDEC EMMANUELLE</strong>
            <br />
            Entrepreneur individuel (auto-entrepreneur)
            <br />
            87 rue Didot, 75014 Paris, France
            <br />
            <br />
            <strong>SIREN :</strong> 844 130 245
            <br />
            <strong>SIRET :</strong> 844 130 245 00013
            <br />
            <strong>Code APE :</strong> 70.22Z (Conseil pour les affaires et autres conseils de gestion)
            <br />
            <strong>N TVA intracommunautaire :</strong> FR10844130245
            <br />
            <br />
            <strong>Nom commercial :</strong> Jean find my Job
            <br />
            <strong>Site web :</strong>{" "}
            <a href="https://jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              jeanfindmyjob.fr
            </a>
            <br />
            <strong>Email de contact :</strong>{" "}
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              hello@jeanfindmyjob.fr
            </a>
          </Box>
          <p>Le directeur de la publication est <strong>Emmanuelle Gonidec</strong>, en sa qualite d&apos;editrice individuelle.</p>
        </Section>

        <Section title="2. Hebergement">
          <p>
            <strong>Backend et site web (jeanfindmyjob.fr) :</strong>
            <br />
            Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, Etats-Unis.
            <br />
            Site :{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: RED, fontWeight: 700 }}>
              vercel.com
            </a>
          </p>
          <p style={{ marginTop: "1rem" }}>
            <strong>Base de donnees et stockage :</strong>
            <br />
            Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992 - instance hebergee dans l&apos;Union europeenne (region eu-west-1, Irlande).
          </p>
          <p style={{ marginTop: "1rem" }}>
            <strong>Distribution de l&apos;extension :</strong>
            <br />
            L&apos;extension Chrome sera distribuee publiquement via le Chrome Web Store, opere par Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, Etats-Unis. Tant que l&apos;extension n&apos;est pas publiee, elle est utilisee exclusivement en mode developpeur local par l&apos;editeur.
          </p>
        </Section>

        <Section title="3. Description et finalite de l'extension">
          <p>
            L&apos;extension Chrome <strong>Jean find my Job</strong> est un assistant a la candidature destine aux demandeurs d&apos;emploi. Elle fonctionne en complement de la plateforme principale{" "}
            <a href="https://jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              jeanfindmyjob.fr
            </a>
            , a laquelle l&apos;utilisateur doit disposer d&apos;un compte actif.
          </p>
          <p style={{ marginTop: "1rem" }}>Ses principales fonctionnalites, a la mise en ligne, seront :</p>
          <ul style={{ paddingLeft: 24, lineHeight: 1.9 }}>
            <li>la capture d&apos;offres d&apos;emploi consultees par l&apos;utilisateur sur des sites tiers ;</li>
            <li>l&apos;analyse de compatibilite entre une offre et le CV de l&apos;utilisateur ;</li>
            <li>la generation assistee de lettres de motivation personnalisees ;</li>
            <li>la mise a jour automatique du tableau de suivi de candidatures de l&apos;utilisateur sur Jean find my Job.</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            L&apos;extension n&apos;envoie aucune candidature de maniere automatisee et ne se substitue pas a l&apos;utilisateur dans ses demarches aupres des employeurs ou plateformes tierces.
          </p>
        </Section>

        <Section title="4. Conditions d'utilisation">
          <p>
            L&apos;usage de l&apos;extension est gratuit et conditionne a la creation prealable d&apos;un compte sur{" "}
            <a href="https://jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              jeanfindmyjob.fr
            </a>
            . L&apos;utilisateur s&apos;engage a utiliser l&apos;extension de bonne foi, conformement a sa finalite et dans le respect des conditions generales d&apos;utilisation des sites tiers sur lesquels elle s&apos;execute (LinkedIn, France Travail, Welcome to the Jungle, etc.).
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;editeur se reserve le droit de suspendre l&apos;acces a l&apos;extension en cas d&apos;usage abusif, frauduleux, ou contraire aux lois applicables.
          </p>
        </Section>

        <Section title="5. Propriete intellectuelle">
          <p>
            L&apos;ensemble des elements composant l&apos;extension (code source, design, marque Jean find my Job, logo, contenus redactionnels) est la propriete exclusive de Emmanuelle Gonidec, ou fait l&apos;objet d&apos;une autorisation d&apos;usage. Toute reproduction, representation, modification ou exploitation non autorisee est strictement interdite et susceptible de constituer une contrefacon au sens des articles L. 335-2 et suivants du Code de la propriete intellectuelle.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Les marques tierces citees dans l&apos;extension (LinkedIn, France Travail, Welcome to the Jungle, etc.) restent la propriete de leurs titulaires respectifs et ne sont mentionnees qu&apos;a des fins descriptives, sans aucune affiliation, partenariat ou cautionnement.
          </p>
        </Section>

        <Section title="6. Donnees personnelles">
          <p>
            L&apos;extension traite des donnees personnelles dans le cadre de son fonctionnement (notamment : email du compte utilisateur, contenu des offres consultees, contenu du CV). Ces traitements sont regis par le Reglement General sur la Protection des Donnees (RGPD) et la loi francaise Informatique et Libertes.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Une <strong>politique de confidentialite specifique a l&apos;extension</strong> sera publiee avant la mise en ligne sur le Chrome Web Store et disponible a l&apos;adresse <strong>jeanfindmyjob.fr/extension-confidentialite</strong>. En attendant, les principes generaux applicables sont detailles dans la{" "}
            <Link href="/confidentialite" style={{ color: RED, fontWeight: 700 }}>
              politique de confidentialite du site Jean find my Job
            </Link>
            .
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur dispose a tout moment d&apos;un droit d&apos;acces, de rectification, d&apos;effacement, de portabilite, de limitation et d&apos;opposition concernant ses donnees. Ces droits peuvent etre exerces en ecrivant a{" "}
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              hello@jeanfindmyjob.fr
            </a>
            .
          </p>
        </Section>

        <Section title="7. Limitation de responsabilite">
          <p>
            L&apos;extension est fournie en l&apos;etat, sans garantie d&apos;aucune sorte. L&apos;editeur s&apos;efforce d&apos;assurer son bon fonctionnement et l&apos;exactitude des informations qu&apos;elle traite, mais ne saurait etre tenu responsable :
          </p>
          <ul style={{ paddingLeft: 24, lineHeight: 1.9 }}>
            <li>de l&apos;indisponibilite temporaire de l&apos;extension ou des services associes (Jean find my Job, Supabase, API tierces) ;</li>
            <li>d&apos;erreurs ou d&apos;imprecisions dans les analyses de compatibilite d&apos;offres ou les suggestions generees par intelligence artificielle ;</li>
            <li>de modifications unilaterales par les sites tiers (LinkedIn, France Travail, Welcome to the Jungle, etc.) susceptibles d&apos;alterer le fonctionnement de l&apos;extension ;</li>
            <li>des decisions prises par l&apos;utilisateur sur la base des informations affichees par l&apos;extension (notamment les decisions de candidature ou de non-candidature).</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur reste seul responsable des candidatures qu&apos;il choisit d&apos;envoyer et des informations qu&apos;il transmet a des tiers via l&apos;extension ou en dehors.
          </p>
        </Section>

        <Section title="8. Relations avec les sites tiers">
          <p>
            L&apos;extension fonctionne en complement de sites tiers d&apos;offres d&apos;emploi (LinkedIn, France Travail, Welcome to the Jungle, et autres pris en charge ulterieurement). Ces sites ne sont lies a Jean find my Job par aucun partenariat, accord commercial ou affiliation. L&apos;extension se contente de lire, a la demande explicite de l&apos;utilisateur, le contenu d&apos;une page d&apos;offre que celui-ci consulte volontairement.
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur est invite a respecter les conditions generales d&apos;utilisation propres a chaque site tiers. L&apos;editeur de Jean find my Job decline toute responsabilite en cas de litige entre l&apos;utilisateur et un site tiers consecutif a l&apos;usage de l&apos;extension.
          </p>
        </Section>

        <Section title="9. Evolution des presentes mentions">
          <p>
            L&apos;extension etant en cours de developpement actif, les presentes mentions peuvent etre modifiees a tout moment pour refleter l&apos;evolution des fonctionnalites, des permissions techniques requises, ou du cadre legal applicable. La date de derniere mise a jour est indiquee en haut de page.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Une version definitive et stable des presentes mentions sera publiee a la mise en ligne de l&apos;extension sur le Chrome Web Store.
          </p>
        </Section>

        <Section title="10. Loi applicable et juridiction competente">
          <p>
            Les presentes mentions legales sont soumises au droit francais. Tout litige relatif a leur interpretation ou a l&apos;usage de l&apos;extension qui ne pourrait etre resolu a l&apos;amiable sera soumis a la competence exclusive des tribunaux francais, et notamment des tribunaux du ressort de Paris pour les litiges entre professionnels.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Conformement aux dispositions des articles L. 611-1 et suivants du Code de la consommation, en cas de litige, les utilisateurs consommateurs ont la possibilite de recourir gratuitement a un mediateur de la consommation en vue d&apos;une resolution amiable.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Pour toute question concernant les presentes mentions legales, l&apos;extension Chrome ou le traitement des donnees personnelles, l&apos;utilisateur peut contacter l&apos;editeur a l&apos;adresse suivante :{" "}
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              hello@jeanfindmyjob.fr
            </a>
            .
          </p>
        </Section>

        <div style={{ marginTop: "4rem", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-block", padding: "12px 24px", background: BLACK, color: YELLOW, textDecoration: "none", fontWeight: 800, fontSize: 14, border: "3px solid #111", boxShadow: "5px 5px 0 #F5C400", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Retour a l&apos;accueil
          </Link>
        </div>
      </main>

      <footer style={{ background: "#fff", borderTop: "2.5px solid #111", padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
          {`© ${new Date().getFullYear()} Jean find my Job - Tous droits reserves`}
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #111" }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#222" }}>{children}</div>
    </section>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: GRAY_BG, border: "2px solid #111", boxShadow: "3px 3px 0 #111", padding: "1.25rem", margin: "1rem 0", fontSize: 14, lineHeight: 1.7 }}>
      {children}
    </div>
  );
}
