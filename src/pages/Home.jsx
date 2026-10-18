import { Reveal } from '../components/Reveal.jsx';
import spotlight from '../assets/spotlight-3d-premium.svg';
import { rentalSteps } from '../data/site.js';
import { whatsappLink } from '../utils/format.js';
import { Button } from '../components/Button.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';

export function Home() {
    return (
        <main id="main-content">
            <section className="hero" aria-labelledby="hero-title">
                <Reveal className="hero-content">
                    <p className="eyebrow">EURO LIGHT · LOCAÇÃO PARA EVENTOS</p>
                    <h1 id="hero-title">Seu evento.<br />Uma experiência <span>completa.</span></h1>
                    <p className="hero-description">A iluminação certa faz toda a diferença. Encontre os equipamentos para dar vida à sua próxima festa.</p>
                    <div className="hero-actions">
                        <Button href="/equipamentos">Explorar equipamentos ↗</Button>
                        <a className="text-link" href="#help">Como funciona ↓</a>
                    </div>
                    <p className="hero-note">Você escolhe. A gente ajuda a fazer acontecer.</p>
                </Reveal>
                <Reveal className="hero-visual" delay={120}>
                    <div className="spotlight-ring">
                        <img src={spotlight} alt="Refletor 3D para iluminação de eventos" />
                    </div>
                    <span className="visual-label">A luz certa para o seu momento ✦</span>
                </Reveal>
            </section>

            <section className="section steps-section" id="help" aria-labelledby="steps-title">
                <SectionHeading
                    id="steps-title"
                    eyebrow="DO PRIMEIRO CONTATO À FESTA"
                    title="Alugar é mais simples do que parece."
                    description="Conte com a nossa família em cada etapa do seu evento."
                />
                <div className="steps-grid">
                    {rentalSteps.map((step, index) => (
                        <Reveal as="article" className="step-card" key={step.title} delay={index * 60}>
                            <span className="step-number">0{index + 1}</span>
                            <h3>{step.title}</h3>
                            <p className="muted">{step.description}</p>
                        </Reveal>
                    ))}
                </div>
            </section>

            <Reveal as="section" className="booking-banner section" id="locar">
                <div>
                    <p className="eyebrow">VAMOS MONTAR SUA FESTA?</p>
                    <h2>A luz certa transforma<br />qualquer evento.</h2>
                    <p className="muted">Explore os efeitos e monte sua sacola do seu jeito.</p>
                </div>
                <Button href="/equipamentos">Ver catálogo ↗</Button>
            </Reveal>

            <Reveal as="section" className="contact-section section" id="contactCard">
                <div>
                    <h2>Precisa de uma mão para escolher?</h2>
                    <p className="muted">Fale com nossa equipe e consulte mais opções de equipamentos.</p>
                </div>
                <Button variant="contact" href={whatsappLink()} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp ↗</Button>
            </Reveal>
        </main>
    );
}
