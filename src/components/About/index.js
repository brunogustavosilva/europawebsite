import React from 'react';
import {
  ServicesContainer, ServText, ImageContainer, CardWrapper,
} from '../../assets/styles/services';
import contract from '../../assets/contract.jpg';

function Services() {
  return (
    <ServicesContainer id="about">
      <CardWrapper>
        <ImageContainer>
          <img src={contract} alt="Imagem do serviço" />
        </ImageContainer>
        <ServText>
          <h2>Como realizar a locação</h2>
          <p>
            Entre em contato com nossos atendentes e nos conte alguns detalhes sobre seu evento como:
            <br />
            &bull; Qual é o tipo de festa?
            <br />
            Infantil, debutante, casamento, aniversário, etc…
            <br />
            &bull; Qual o tema da sua festa?
            <br />
            Néon, cor específica, flash dance, fantasia, Halloween, etc…
            <br />
            &bull; Para quantos convidados ?
            <br />
            Diante dessas informações vamos encaminhar algumas fotos e vídeos para te ajudar a escolher quais efeitos vão fazer sua festa ser inesquecível. E caso prefira pode ir até nossa loja física e escolher os efeitos pessoalmente, ver de modo ainda mais real quais luzes e efeitos gosta mais.
            Após a escolha dos equipamentos é a hora de receber seu orçamento para aprovação, lembrando que você pode retirar e devolver na loja, ou optar por entrega e coleta, neste caso com taxas de deslocamento conforme distância.
            Para reservar seu kit é necessário pagar um sinal de 30% referente ao valor total da locação.
            Para retirada é
            {' '}
            <span className="danger">INDISPENSÁVEL</span>
            {' '}
            a apresentação de comprovante de endereço atualizado e no nome da pessoa que vai se apresentar para a retirada e assinatura do contrato – são aceitos como comprovante de endereço somente contas de água, luz e internet residencial.
            No momento da retirada é realizado o pagamento do restante do valor da locação.

          </p>
          <a className="button" href="#service">
            Serviços
          </a>
        </ServText>
      </CardWrapper>
    </ServicesContainer>
  );
}

export default Services;
