import {
  FooterWrapper, FooterColumns, FooterColumn, FooterLink, FooterItem, FooterIcon,
} from '../../assets/styles/footer'; // Estilos personalizados
import instagramIcon from '../../assets/icons/instagram.svg';
import phoneIcon from '../../assets/icons/whatsapp.svg'; // Exemplo de ícone para telefone
import addressIcon from '../../assets/icons/address.svg'; // Exemplo de ícone para endereço

function Footer() {
  return (
    <FooterWrapper>
      <FooterColumns>
        {' '}
        {/* Usando o FooterColumns como styled component */}
        <FooterColumn>
          <h3>Endereço</h3>
          <FooterItem>
            <FooterIcon src={addressIcon} alt="Ícone de endereço" className="footer-icon" />
            <p>Rua Niterói 473, Curitiba, Cajuru.</p>
          </FooterItem>
        </FooterColumn>
        <FooterColumn>
          <h3>Telefone</h3>
          <FooterItem>
            <FooterIcon src={phoneIcon} alt="Ícone de telefone" className="footer-icon" />
            <p>(41) 99862-6862</p>
          </FooterItem>
        </FooterColumn>
        <FooterColumn>
          <h3>Horário de Atendimento</h3>
          <FooterItem>
            <p>Quinta á terça: 10h - 18h</p>
          </FooterItem>
          <FooterLink>
            <FooterItem>
              <FooterIcon src={instagramIcon} alt="Ícone de Instagram" className="footer-icon" />
              <a href="https://www.instagram.com/europaacessorios/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </FooterItem>
          </FooterLink>
        </FooterColumn>
      </FooterColumns>
    </FooterWrapper>
  );
}

export default Footer;
