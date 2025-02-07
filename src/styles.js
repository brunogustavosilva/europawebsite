import styled from 'styled-components';

export const Container = styled.div`
  min-height: calc(100vh - 60px); /* Garante que o container ocupe o restante da altura da tela */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Alinha o conteúdo no topo */
`;
