import { getAllGeothermKnowledgeImages } from "@/lib/geothermKnowledge";

export const metadata = {
  title: "GEOTHERM image knowledge audit",
};

export default function KnowledgeImagesPage() {
  const images = getAllGeothermKnowledgeImages();

  return (
    <main className="image-audit-page">
      <header className="image-audit-header">
        <div>
          <p>GEOTHERM AI knowledge base</p>
          <h1>Obrázky a inštrukcie pre AI</h1>
        </div>
        <strong>{images.length} obrázkov</strong>
      </header>

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
    </main>
  );
}
