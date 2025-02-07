import React, { useEffect } from 'react';
import gsap from 'gsap';
import {
  ServicesContainer, ServText, ImageContainer, CardWrapper,
} from '../../assets/styles/services';
import lightImage from '../../assets/luzes.png';
import wand from '../../assets/wand.png';

function Services() {
  useEffect(() => {
    gsap.to('.button-rgb', {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'none',
      keyframes: [
        { backgroundColor: 'rgb(255, 0, 0)' },
        { backgroundColor: 'rgb(0, 255, 0)' },
        { backgroundColor: 'rgb(0, 0, 255)' },
        { backgroundColor: 'rgb(255, 0, 255)' },
      ],
    });
  }, []);

  return (
    <ServicesContainer id="service">
      <CardWrapper>
        <ServText>
          <h2>Serviços</h2>
          <p>
            Oferecemos uma variedade de equipamentos audiovisuais que possibilitam deixar o ambiente do seu evento com um clima especial como tem que ser, da magia da simplicidade, ao espetáculo e glamour.
          </p>
          <a className="button button-rgb" href="#contato">
            Mostre-me os efeitos
            <img src={wand} alt="" className="icons" />
          </a>
        </ServText>
        <ImageContainer>
          <img src={lightImage} alt="Imagem do serviço" />
        </ImageContainer>
      </CardWrapper>
    </ServicesContainer>
  );
}

export default Services;
