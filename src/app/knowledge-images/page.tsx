import { geothermImageCatalog } from "@/lib/geothermEntityCatalog";
import { getAllGeothermKnowledgeImages } from "@/lib/geothermKnowledge";

export const metadata = {
  title: "GEOTHERM image knowledge audit",
};

export default function KnowledgeImagesPage() {
  const images = getAllGeothermKnowledgeImages();
  const approvedCount = geothermImageCatalog.filter((image) => image.quality === "approved").length;

  return (
    <main className="image-audit-page">
      <header className="image-audit-header">
        <div>
          <p>GEOTHERM AI knowledge base</p>
          <h1>Obrázky a inštrukcie pre AI</h1>
        </div>
        <strong>{approvedCount} approved / {images.length} scraped</strong>
      </header>

      <section className="image-audit-section">
        <div className="image-audit-section-title">
          <p>To, čo môže ísť do chatu</p>
          <h2>Riadený image catalog</h2>
        </div>

        <div className="image-audit-list">
          {geothermImageCatalog.map((image, index) => (
            <article className={`image-audit-card image-quality-${image.quality}`} key={image.id}>
              <div className="image-audit-media">
                <span>{index + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
              </div>

              <div className="image-audit-copy">
                <div className="image-audit-title">
                  <h2>{image.alt}</h2>
                  <span className="image-quality-badge">{image.quality}</span>
                </div>

                <dl>
                  <div>
                    <dt>Čo AI vidí</dt>
                    <dd>{image.verifiedDescription}</dd>
                  </div>
                  <div>
                    <dt>Kedy použiť</dt>
                    <dd>{image.topics.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Blokované témy</dt>
                    <dd>{image.blockedTopics?.join(", ") || "žiadne"}</dd>
                  </div>
                  <div>
                    <dt>URL</dt>
                    <dd className="image-audit-url">{image.url}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="image-audit-section">
        <div className="image-audit-section-title">
          <p>Kompletný scrape audit</p>
          <h2>Všetky nájdené obrázky</h2>
        </div>

      <section className="image-audit-list" aria-label="Zoznam obrázkov v knowledge base">
        {images.map((image, index) => (
          <article className="image-audit-card" key={image.url}>
            <div className="image-audit-media">
              <span>{index + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt || image.description} loading="lazy" decoding="async" />
            </div>

            <div className="image-audit-copy">
              <div className="image-audit-title">
                <h2>{image.alt || "Bez alt textu"}</h2>
                <a href={image.url} target="_blank" rel="noreferrer">
                  Otvoriť obrázok
                </a>
              </div>

              <dl>
                <div>
                  <dt>Čo AI vidí</dt>
                  <dd>{image.description}</dd>
                </div>
                <div>
                  <dt>Kedy použiť</dt>
                  <dd>{image.useWhen}</dd>
                </div>
                <div>
                  <dt>Zdrojová stránka</dt>
                  <dd>
                    <a href={image.sourceUrl} target="_blank" rel="noreferrer">
                      {image.sourceTitle || image.sourceUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>URL</dt>
                  <dd className="image-audit-url">{image.url}</dd>
                </div>
                {image.tags.length ? (
                  <div>
                    <dt>Tagy stránky</dt>
                    <dd>{image.tags.join(", ")}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </article>
        ))}
      </section>
      </section>
    </main>
  );
}
