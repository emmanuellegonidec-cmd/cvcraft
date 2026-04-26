import Link from "next/link";

export const metadata = {
  title: "Mentions légales — Extension Chrome | Jean find my Job",
  description:
    "Mentions légales de l'extension Chrome Jean find my Job : éditeur, hébergement, propriété intellectuelle, données personnelles et conditions d'utilisation.",
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
            Retour à l&apos;accueil
          </Link>
          <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
            Dernière mise à jour : 26 avril 2026
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 3rem 5rem" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: "0.5rem", letterSpacing: "-1px" }}>
          Mentions légales — Extension Chrome
        </h1>

        <p style={{ fontSize: 16, color: "#555", marginBottom: "3rem", lineHeight: 1.6 }}>
          La présente page concerne spécifiquement l&apos;extension Chrome <strong>Jean find my Job</strong>, actuellement en cours de développement. Elle complète les{" "}
          <Link href="/mentions-legales" style={{ color: RED, fontWeight: 700 }}>
            mentions légales générales du site
          </Link>{" "}
          et sera mise à jour à la mise en ligne publique de l&apos;extension sur le Chrome Web Store.
        </p>

        <Section title="1. Éditeur de l'extension">
          <p>L&apos;extension Chrome <strong>Jean find my Job</strong> est éditée par :</p>
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
            <strong>N° TVA intracommunautaire :</strong> FR10844130245
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
          <p>Le directeur de la publication est <strong>Emmanuelle Gonidec</strong>, en sa qualité d&apos;éditrice individuelle.</p>
        </Section>

        <Section title="2. Hébergement">
          <p>
            <strong>Backend et site web (jeanfindmyjob.fr) :</strong>
            <br />
            Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.
            <br />
            Site :{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: RED, fontWeight: 700 }}>
              vercel.com
            </a>
          </p>
          <p style={{ marginTop: "1rem" }}>
            <strong>Base de données et stockage :</strong>
            <br />
            Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992 — instance hébergée dans l&apos;Union européenne (région eu-west-1, Irlande).
          </p>
          <p style={{ marginTop: "1rem" }}>
            <strong>Distribution de l&apos;extension :</strong>
            <br />
            L&apos;extension Chrome sera distribuée publiquement via le Chrome Web Store, opéré par Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis. Tant que l&apos;extension n&apos;est pas publiée, elle est utilisée exclusivement en mode développeur local par l&apos;éditeur.
          </p>
        </Section>

        <Section title="3. Description et finalité de l'extension">
          <p>
            L&apos;extension Chrome <strong>Jean find my Job</strong> est un assistant à la candidature destiné aux demandeurs d&apos;emploi. Elle fonctionne en complément de la plateforme principale{" "}
            <a href="https://jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              jeanfindmyjob.fr
            </a>
            , à laquelle l&apos;utilisateur doit disposer d&apos;un compte actif.
          </p>
          <p style={{ marginTop: "1rem" }}>Ses principales fonctionnalités, à la mise en ligne, seront :</p>
          <ul style={{ paddingLeft: 24, lineHeight: 1.9 }}>
            <li>la capture d&apos;offres d&apos;emploi consultées par l&apos;utilisateur sur des sites tiers ;</li>
            <li>l&apos;analyse de compatibilité entre une offre et le CV de l&apos;utilisateur ;</li>
            <li>la génération assistée de lettres de motivation personnalisées ;</li>
            <li>la mise à jour automatique du tableau de suivi de candidatures de l&apos;utilisateur sur Jean find my Job.</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            L&apos;extension n&apos;envoie aucune candidature de manière automatisée et ne se substitue pas à l&apos;utilisateur dans ses démarches auprès des employeurs ou plateformes tierces.
          </p>
        </Section>

        <Section title="4. Conditions d'utilisation">
          <p>
            L&apos;usage de l&apos;extension est gratuit et conditionné à la création préalable d&apos;un compte sur{" "}
            <a href="https://jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              jeanfindmyjob.fr
            </a>
            . L&apos;utilisateur s&apos;engage à utiliser l&apos;extension de bonne foi, conformément à sa finalité et dans le respect des conditions générales d&apos;utilisation des sites tiers sur lesquels elle s&apos;exécute (LinkedIn, France Travail, Welcome to the Jungle, etc.).
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;éditeur se réserve le droit de suspendre l&apos;accès à l&apos;extension en cas d&apos;usage abusif, frauduleux, ou contraire aux lois applicables.
          </p>
        </Section>

        <Section title="5. Propriété intellectuelle">
          <p>
            L&apos;ensemble des éléments composant l&apos;extension (code source, design, marque Jean find my Job, logo, contenus rédactionnels) est la propriété exclusive de Emmanuelle Gonidec, ou fait l&apos;objet d&apos;une autorisation d&apos;usage. Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite et susceptible de constituer une contrefaçon au sens des articles L. 335-2 et suivants du Code de la propriété intellectuelle.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Les marques tierces citées dans l&apos;extension (LinkedIn, France Travail, Welcome to the Jungle, etc.) restent la propriété de leurs titulaires respectifs et ne sont mentionnées qu&apos;à des fins descriptives, sans aucune affiliation, partenariat ou cautionnement.
          </p>
        </Section>

        <Section title="6. Données personnelles">
          <p>
            L&apos;extension traite des données personnelles dans le cadre de son fonctionnement (notamment : email du compte utilisateur, contenu des offres consultées, contenu du CV). Ces traitements sont régis par le Règlement Général sur la Protection des Données (RGPD) et la loi française Informatique et Libertés.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Une <strong>politique de confidentialité spécifique à l&apos;extension</strong> sera publiée avant la mise en ligne sur le Chrome Web Store et disponible à l&apos;adresse <strong>jeanfindmyjob.fr/extension-confidentialite</strong>. En attendant, les principes généraux applicables sont détaillés dans la{" "}
            <Link href="/confidentialite" style={{ color: RED, fontWeight: 700 }}>
              politique de confidentialité du site Jean find my Job
            </Link>
            .
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur dispose à tout moment d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité, de limitation et d&apos;opposition concernant ses données. Ces droits peuvent être exercés en écrivant à{" "}
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              hello@jeanfindmyjob.fr
            </a>
            .
          </p>
        </Section>

        <Section title="7. Limitation de responsabilité">
          <p>
            L&apos;extension est fournie en l&apos;état, sans garantie d&apos;aucune sorte. L&apos;éditeur s&apos;efforce d&apos;assurer son bon fonctionnement et l&apos;exactitude des informations qu&apos;elle traite, mais ne saurait être tenu responsable :
          </p>
          <ul style={{ paddingLeft: 24, lineHeight: 1.9 }}>
            <li>de l&apos;indisponibilité temporaire de l&apos;extension ou des services associés (Jean find my Job, Supabase, API tierces) ;</li>
            <li>d&apos;erreurs ou d&apos;imprécisions dans les analyses de compatibilité d&apos;offres ou les suggestions générées par intelligence artificielle ;</li>
            <li>de modifications unilatérales par les sites tiers (LinkedIn, France Travail, Welcome to the Jungle, etc.) susceptibles d&apos;altérer le fonctionnement de l&apos;extension ;</li>
            <li>des décisions prises par l&apos;utilisateur sur la base des informations affichées par l&apos;extension (notamment les décisions de candidature ou de non-candidature).</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur reste seul responsable des candidatures qu&apos;il choisit d&apos;envoyer et des informations qu&apos;il transmet à des tiers via l&apos;extension ou en dehors.
          </p>
        </Section>

        <Section title="8. Relations avec les sites tiers">
          <p>
            L&apos;extension fonctionne en complément de sites tiers d&apos;offres d&apos;emploi (LinkedIn, France Travail, Welcome to the Jungle, et autres pris en charge ultérieurement). Ces sites ne sont liés à Jean find my Job par aucun partenariat, accord commercial ou affiliation. L&apos;extension se contente de lire, à la demande explicite de l&apos;utilisateur, le contenu d&apos;une page d&apos;offre que celui-ci consulte volontairement.
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;utilisateur est invité à respecter les conditions générales d&apos;utilisation propres à chaque site tiers. L&apos;éditeur de Jean find my Job décline toute responsabilité en cas de litige entre l&apos;utilisateur et un site tiers consécutif à l&apos;usage de l&apos;extension.
          </p>
        </Section>

        <Section title="9. Évolution des présentes mentions">
          <p>
            L&apos;extension étant en cours de développement actif, les présentes mentions peuvent être modifiées à tout moment pour refléter l&apos;évolution des fonctionnalités, des permissions techniques requises, ou du cadre légal applicable. La date de dernière mise à jour est indiquée en haut de page.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Une version définitive et stable des présentes mentions sera publiée à la mise en ligne de l&apos;extension sur le Chrome Web Store.
          </p>
        </Section>

        <Section title="10. Loi applicable et juridiction compétente">
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur interprétation ou à l&apos;usage de l&apos;extension qui ne pourrait être résolu à l&apos;amiable sera soumis à la compétence exclusive des tribunaux français, et notamment des tribunaux du ressort de Paris pour les litiges entre professionnels.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Conformément aux dispositions des articles L. 611-1 et suivants du Code de la consommation, en cas de litige, les utilisateurs consommateurs ont la possibilité de recourir gratuitement à un médiateur de la consommation en vue d&apos;une résolution amiable.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Pour toute question concernant les présentes mentions légales, l&apos;extension Chrome ou le traitement des données personnelles, l&apos;utilisateur peut contacter l&apos;éditeur à l&apos;adresse suivante :{" "}
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: RED, fontWeight: 700 }}>
              hello@jeanfindmyjob.fr
            </a>
            .
          </p>
        </Section>

        <div style={{ marginTop: "4rem", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-block", padding: "12px 24px", background: BLACK, color: YELLOW, textDecoration: "none", fontWeight: 800, fontSize: 14, border: "3px solid #111", boxShadow: "5px 5px 0 #F5C400", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <footer style={{ background: "#fff", borderTop: "2.5px solid #111", padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>
          {`© ${new Date().getFullYear()} Jean find my Job — Tous droits réservés`}
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
