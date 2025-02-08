import React, { useEffect } from 'react';
import { gsap } from 'gsap'; // Importando o GSAP
import { EffectSectionContainer, VideoContainer, TextContainer } from '../../assets/styles/effectsection';
import lights from '../../assets/lights.mp4'; // Exemplo de vídeo
import wpp from '../../assets/whatsapp.svg';

function EffectSection() {
  useEffect(() => {
    // Animação para o efeito de troca de cores do fundo
    const card = document.querySelector('.effect-card');

    gsap.to(card, {
      duration: 3,
      background: 'linear-gradient(0deg, #000000 0%,rgb(0, 0, 255) 100%)', // Gradiente entre azul e preto
      repeat: -1, // Repete indefinidamente
      yoyo: true, // Faz a animação ir e voltar
      ease: 'quad.inOut', // Tipo de transição
    });
  }, []);

  return (
    <EffectSectionContainer id="contato" className="effect-card">
      <TextContainer>
        <h2>Efeitos e Vídeos</h2>
        <p>
          Explore os efeitos visuais que podem transformar sua experiência em eventos e momentos especiais.
        </p>
        <a className="button" target="_blank" href="https://wa.me/5541998626862?text=Ol%C3%A1%20vim%20pelo%20seu%20site" rel="noreferrer">
          <img src={wpp} alt="" className="whatsappIcon" />
          Entrar em contato
        </a>
      </TextContainer>
      <VideoContainer>
        <video src={lights} autoPlay loop muted />
      </VideoContainer>
    </EffectSectionContainer>
  );
}

export default EffectSection;
