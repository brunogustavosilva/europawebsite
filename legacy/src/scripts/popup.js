const contactCard = document.querySelector('#contactCard');

let tempoPassou = false;
let tempoExedeu = false;
let cardVisivel = false;

setTimeout(() => {
    tempoPassou = true;
    verificarCard();
}, 10000);

setTimeout(() => {
    tempoExedeu = true;
    verificarCard();
}, 20000);

function verificarCard() {
    if (tempoPassou && !cardVisivel) {
        contactCard.classList.add('show');
        cardVisivel = true;
    } if (tempoExedeu && cardVisivel) {
        contactCard.classList.remove('show');
        cardVisivel = false;
    }
}