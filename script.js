// =================== Admin Panel ===================
let allContestants = [
  "Abhishek Bajaj","Amaal Mallik","Ashnoor Kaur","Awez Darbar","Baseer Ali",
  "Farhana Bhatt","Gaurav Khanna","Kunickaa Sadanand","Mridul Tiwari","Nagma Mirajkar",
  "Natalia Janoszek","Neelam Giri","Nehal Chudasama","Pranit More","Shehbaz Badesha",
  "Tanya Mittal","Zeishan Quadri"
];
let nominated = [];

// Render contestants for admin selection
function renderAdminContestants() {
  const container = document.getElementById("admin-contestants");
  if (!container) return;
  container.innerHTML = "";
  allContestants.forEach(name => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `<img src="Contestant/${name}.jpg"><p>${name}</p>`;
    card.onclick = () => {
      card.classList.toggle("selected");
      if (nominated.includes(name)) {
        nominated = nominated.filter(n => n !== name);
      } else {
        nominated.push(name);
      }
    };
    container.appendChild(card);
  });
}

// Save nominations to localStorage
function saveNominations() {
  localStorage.setItem("nominated", JSON.stringify(nominated));
  alert("Nominations saved!");
}

// =================== Prediction Page ===================
function renderPrediction() {
  const container = document.getElementById("prediction-cards");
  if (!container) return;
  const saved = JSON.parse(localStorage.getItem("nominated")) || [];
  let selected = null;
  saved.forEach(name => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `<img src="Contestant/${name}.jpg"><p>${name}</p>`;
    card.onclick = () => {
      document.querySelectorAll("#prediction-cards .card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selected = name;
    };
    container.appendChild(card);
  });

  document.getElementById("submit-prediction")?.addEventListener("click", () => {
    if (selected) {
      localStorage.setItem("prediction", selected);
      alert("Prediction submitted: " + selected);
    } else {
      alert("Please select a contestant!");
    }
  });
}
renderPrediction();

// =================== Leaderboard ===================
let leaderboardData = [
  { name: "Player1", points: 50 },
  { name: "Player2", points: 80 },
  { name: "Player3", points: 30 }
];

function renderLeaderboard() {
  const grid = document.getElementById("leaderboard-grid");
  if (!grid) return;
  grid.innerHTML = "";
  leaderboardData.forEach(player => {
    const card = document.createElement("div");
    card.classList.add("leaderboard-card");
    card.innerHTML = `<h3>${player.name}</h3><p>Points: ${player.points}</p>`;
    grid.appendChild(card);
  });
}
renderLeaderboard();

// =================== Admin Auth ===================
function checkAdmin() {
  const pass = document.getElementById("admin-pass").value;
  if (pass === "admin123") {
    document.getElementById("admin-tools").classList.remove("hidden");
    renderAdminContestants();
  } else {
    alert("Invalid password!");
  }
}

// Other admin features
function updateScores() {
  alert("Scores updated!");
}
function resetGame() {
  localStorage.clear();
  alert("Game reset!");
}
