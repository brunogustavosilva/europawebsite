import styled from 'styled-components';

// Container principal da EffectSection
export const EffectSectionContainer = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  width: 80vw;
  max-height: 90%;
  overflow: hidden;
  position: relative;
  background: rgba(47, 47, 47, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 1366px) {
    max-height: unset;

    flex-direction: column;
    text-align: center;
  }

  @media (max-width: 767px) {
    padding-top: 30px;
    border-radius: 0;
    width: 100vw;
  }
`;

// Container do vídeo (do lado direito)
export const VideoContainer = styled.div`
  width: 50%; /* Largura do vídeo */
  height: 700px;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  display: flex;
  justify-content: center; /* Centraliza o vídeo horizontalmente */
  align-items: center; /* Centraliza o vídeo verticalmente */

  video {
    max-width: 768px;
    height: 100%;
  }

  @media (max-width: 1366px) {
    width: 100%;
    height: 100%;

    video {
    max-width: 768px;
    height: 75vh;
  }
  }
`;

// Container do texto (do lado esquerdo)
export const TextContainer = styled.div`
  width: 48%; /* Ajuste conforme necessário */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;

  h2 {
    font-size: var(--font-size-h2);
  }

  p {
    font-size: var(--font-size-p);
  }

  img {
    max-width: 25vh;
  }

  a.button {
    background: rgb(0, 217, 72);
  }

  a.button:hover {
    background: rgb(0, 133, 29);
  }

  .whatsappIcon {
  width: 24px;   /* Tamanho do emote */
  height: auto;   /* Mantém a proporção */
  margin-right: 8px;  /* Espaço entre o texto e o emote */
}

  @media (max-width: 1366px) {
    width: 90%;
    align-items: center;
    text-align: center;

    .button {
      justify-content: center;
      width: 500px;
      margin-top: 40px;
    }
  }

  @media (max-width: 620px) {

    h2 {
      font-size: 2rem;
      padding-bottom: 20px;
    }

   p {
    font-size: 1.3rem;
   }

    .button {
      display: flex;
      align-items: center;
      width: 270px;
      font-size: 1.2rem;
    }

    padding: 20px 0;
  }
`;
