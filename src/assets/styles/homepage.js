import styled, { keyframes } from 'styled-components';

export const HomePageContainer = styled.section`
  position: relative;
  height: 100vh; /* Garante que o vídeo cubra a tela inteira */
  width: 100%;
  overflow: hidden; /* Garante que o vídeo não ultrapasse os limites da section */

  .destaque {
    font-weight: bold;
  }


  .video-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1; /* Coloca o vídeo atrás do conteúdo */
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Faz o vídeo cobrir todo o espaço */
    position: absolute;
    top: 0;
    left: 0;
    filter: blur(8px); /* Aplica o efeito de blur diretamente no vídeo */
    opacity: 0.2;
  }

  .buttons-wrap{
    display: flex;
    flex-direction: column;
    width: 350px;
    transition: all ease-in-out 0.5s;
  }

  .whatsapp {
    background: linear-gradient(0deg, rgba(0,115,48,1) 0%, rgba(0,255,175,1) 100%);
  }

  .whatsapp:hover {
    background: linear-gradient(0deg, rgba(0,115,48,1) 0%, rgba(0,157,108,1) 100%);
  }

  @media (max-width: 1536px) {
    display: flex;
    justify-content: center;
    align-items: center;

    .buttons-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .text-container {
      display: grid;
      place-items: center;
      padding-bottom: 150px;
    }

    .button {
      justify-content: center;
      width: 350px;
    }
  }

  @media (max-height: 700px) {
    .text-container {
      padding-top: 100px;
    }
  }

  @media (max-height: 525px) {
    .text-container {
      padding-top: 250px;
    }
  }

  @media (max-width: 534px) {
    .button {
      width: 300px;
      font-size: 1rem;
    }

    .text-container {
      padding-bottom: 200px;

      display: flex;
      flex-direction: column;

      h1 {
        font-size: 2rem;
      }

      p {
        font-size: 1.1rem;
      }
    }
  }
`;

export const TextContent = styled.div`
  color: white;
  z-index: 1;
  position: absolute;
  top: 40%; /* Coloca o conteúdo no meio verticalmente */
  left: 30%; /* Alinha o conteúdo no meio horizontalmente */
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 900px;

  h1 {
    font-size: var(--font-size-h1);
    margin: 0;
    position: relative;
  }

  .responsive-break {
    display: none; /* Esconde o <br /> por padrão em telas grandes */
  }

  p {
    padding: 25px 0;
    font-size: var(--font-size-p);
    font-weight: 400;
  }

  @media (max-width: 1536px) {
    top: unset;
    left: unset;
    transform: unset;
    max-width: auto;
  }

  @media (max-width: 950px) {
  .text-container {
    text-align: center; /* Garante que o texto fique no centro */
  }

  h1 {
    text-align: center; /* Garante que todo o conteúdo dentro do h1 fique centralizado */
    margin: 0; /* Remove margens extras */
  }

  .responsive-break {
    display: block; /* Exibe o <br /> para quebrar as linhas em telas menores */
  }
  }

  @media (max-width: 600px) {
  padding: 0 16px;
  }
`;

const slideUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ChangingText = styled.span`
  font-size: var(--font-size-h1);
  font-weight: bold;
  color: transparent; /* Para aplicar o gradiente de fundo */
  margin-top: 10px;
  opacity: 0;
  transform: translateY(20px);
  animation: ${slideUp} 1s forwards;

  /* Gradiente específico para cada palavra */
  background: linear-gradient(180deg,rgb(21, 0, 255),rgb(0, 187, 255));
  -webkit-background-clip: text;
  background-clip: text;

  @media (max-width: 534px) {
    font-size: 2rem;
  }

`;
