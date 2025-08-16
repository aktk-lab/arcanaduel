let deck = [];
let player1 = [];
let player2 = [];

async function loadDeck() {
  const major = await fetch('arcana_major.json').then(r => r.json());
  const minor = await fetch('arcana_minor.json').then(r => r.json());
  deck = [...major, ...minor];
  shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function drawCard(player) {
  if (deck.length === 0) return;
  const card = deck.pop();
  player.push(card);
  return card;
}

function render() {
  document.getElementById("hand1").innerHTML =
    player1.map(c => `<div>${c.name}</div>`).join("");
  document.getElementById("hand2").innerHTML =
    player2.map(c => `<div>${c.name}</div>`).join("");
}

document.getElementById("draw").addEventListener("click", () => {
  const c1 = drawCard(player1);
  const c2 = drawCard(player2);
  render();
});

loadDeck();