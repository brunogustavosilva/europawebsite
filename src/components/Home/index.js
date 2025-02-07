import { useState, useEffect } from 'react';
import {
  HomePageContainer, TextContent, ChangingText,
} from '../../assets/styles/homepage';
import videoPath from '../../assets/Party2.mp4'; // Importando o vídeo
import bookmark from '../../assets/bookmark.png';

function HomePage() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = ['festas e eventos', 'casamentos', 'momentos especiais', 'debutantes'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 3500); // Troca a frase a cada 3 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, []);

  return (
    <HomePageContainer>
      <div id="home" className="video-container">
        <video autoPlay loop muted>
          <source src={videoPath} type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
      </div>
      <TextContent>
        <div className="text-container">
          <h1>
            Europa Acessórios
            {' '}
            <br className="responsive-break" />
            equipamentos para:
            {' '}
            <br className="responsive-break" />
            {/* Adicionando a chave para forçar a re-renderização */}
            <ChangingText key={phraseIndex}>{phrases[phraseIndex]}</ChangingText>
          </h1>
          <p>
            Na Europa Acessórios alugamos projetores de imagem, som, luzes e efeitos para eventos de pequeno e médio porte, com prestação de serviço confiável e impecável.
            <br />
            <span className="destaque">
              Atendendo desde 2020 com ZERO reclamações
            </span>
          </p>
          <div className="buttons-wrap">
            <a className="button" href="#about">
              Como Alugar
              <img src={bookmark} alt="Party Popper" className="icons" />
            </a>
          </div>
        </div>
      </TextContent>
    </HomePageContainer>
  );
}

export default HomePage;
