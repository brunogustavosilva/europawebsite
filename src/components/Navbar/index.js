import React from 'react';
import {
  Navbar, NavLinks, NavLink, Logo, WhatsappButton,
} from '../../assets/styles/navbar';

import logo from '../../assets/logo.png';

import whatsapp from '../../assets/whatsapp.svg';

function NavbarComponent() {
  const handleClick = () => {
    window.open('https://wa.link/viq6y1', '_blank');
  };

  return (
    <Navbar>
      <Logo>
        <img src={logo} alt="Logo do site" className="site-logo" />
      </Logo>
      <NavLinks>
        <NavLink><a href="#home">Home</a></NavLink>
        <NavLink><a href="#service">Serviços</a></NavLink>
        <NavLink><a href="#contato">Contato</a></NavLink>
      </NavLinks>
      <WhatsappButton onClick={handleClick}>
        <img src={whatsapp} alt="whatsApp" className="whatsappIcon" />
        Whatsapp
      </WhatsappButton>
    </Navbar>
  );
}

export default NavbarComponent;
