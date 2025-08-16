async function drawCard() {
  const response = await fetch("cards.json");
  const cards = await response.json();
  const random = cards[Math.floor(Math.random() * cards.length)];
  document.getElementById("cardDisplay").innerText = `
    【${random.name}】
    種別: ${random.type}
    意味: ${random.meaning}
  `;
}

document.getElementById("drawCard").addEventListener("click", drawCard);