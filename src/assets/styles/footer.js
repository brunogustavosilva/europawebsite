import styled from 'styled-components';

export const FooterWrapper = styled.footer`
  padding: 40px 180px;
  margin-top: 60px;
  background: rgba(47, 47, 47, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  min-height: 150px;
  height: auto;
  width: 100%;

  @media (max-width: 576px) {
    padding: 0;
  }
`;

export const FooterColumns = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;

  @media (max-width: 1127px) {
    max-height: unset;

    flex-direction: column;
    text-align: center;
  }
`;

export const FooterColumn = styled.div`
  flex: 1;
  min-width: 200px;
  padding: 20px;
  text-align: left;

  h3 {
    font-size: var(--font-size-h3);
    font-weight: bold;
    margin-bottom: 15px;
  }

  p {
    font-size: var(--font-size-p);
  }

  @media (max-width: 1127px) {
    text-align: center;
  }

  @media (max-width: 576px) {
    p {
      font-size: 1.2rem;
    }
  }
`;

export const FooterLink = styled.div`
  margin-top: 10px;

  a {
    font-size: var(--font-size-p);
    font-weight: 700;
    transition: color 0.3s ease-in-out;

    &:hover {
      color:rgb(25, 0, 255);
    }
  }
`;

export const FooterItem = styled.div`
  display: flex;
  align-items: center; /* Alinha o ícone e o texto no centro verticalmente */
  gap: 10px; /* Adiciona espaçamento entre o ícone e o texto */

  @media (max-width: 1127px) {
    justify-content: center;
  }
`;

export const FooterIcon = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.3));
`;
