import { GeothermChatbot } from "@/components/GeothermChatbot";

const featureCards = [
  {
    title: "Tepelné čerpadlá",
    text: "Úsporné vykurovanie a chladenie s odborným návrhom pre konkrétny dom.",
  },
  {
    title: "Podlahové vykurovanie",
    text: "Komfortné teplo, čistý interiér a efektívna prevádzka nízkoteplotného systému.",
  },
  {
    title: "Rekuperácia",
    text: "Čerstvý vzduch, nižšie straty tepla a zdravšie bývanie počas celého roka.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">G</span>
            <span>GEOTHERM</span>
          </div>
          <div className="nav-links">
            <span>Produkty</span>
            <span>Dotácie OZE</span>
            <span>Referencie</span>
            <span>Kontakt</span>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Návrh, inštalácia a servis</p>
            <h1>Vykurovanie, vetranie a chladenie na mieru vášmu domu.</h1>
            <p className="lead">
              Demo prostredie pre prémiového AI asistenta, ktorý vie poradiť s riešením,
              vysvetliť možnosti a pripraviť návštevníka na odborný návrh zdarma.
            </p>
            <div className="hero-actions">
              <a href="#proposal">Odborný návrh zdarma</a>
              <span>31 rokov skúseností</span>
            </div>
          </div>

          <div className="system-card" aria-label="Ekologické riešenia domu">
            <div className="home-visual">
              <div className="roof" />
              <div className="house-body" />
              <div className="pump" />
              <div className="solar" />
              <div className="window one" />
              <div className="window two" />
              <div className="garden" />
            </div>
            <div className="system-metrics">
              <div>
                <strong>3 378</strong>
                <span>inštalácií</span>
              </div>
              <div>
                <strong>až 3 800 €</strong>
                <span>dotácie</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">Moderné technológie</p>
          <h2>Spoľahlivé riešenia pre komfortný domov</h2>
        </div>
        <div className="feature-grid">
          {featureCards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="proposal" id="proposal">
        <div>
          <p className="eyebrow">Dry test akcie agenta</p>
          <h2>Návrh riešenia zdarma</h2>
          <p>
            V ostrom WordPresse by agent vytvoril lead cez bezpečné API. V deme iba
            ukáže, ako návštevníka prevedie k ďalšiemu kroku.
          </p>
        </div>
        <form className="proposal-form">
          <input placeholder="Typ domu" />
          <input placeholder="Vykurovaná plocha" />
          <input placeholder="Kontakt" />
          <button type="button">Pripraviť návrh</button>
        </form>
      </section>

      <GeothermChatbot />
    </main>
  );
}
