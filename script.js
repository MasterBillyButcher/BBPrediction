// === CONSTANT DATA ===
const contestantData = [
  { name: "Abhishek Bajaj", instagram: "humarabajaj24" },
  { name: "Amaal Mallik", instagram: "amaal_mallik" },
  { name: "Ashnoor Kaur", instagram: "ashnoorkaur" },
  { name: "Awez Darbar", instagram: "awez_darbar" },
  { name: "Baseer Ali", instagram: "baseer_bob" },
  { name: "Farhana Bhatt", instagram: "farrhana_bhatt" },
  { name: "Gaurav Khanna", instagram: "gauravkhannaofficial" },
  { name: "Kunickaa Sadanand", instagram: "iam_kunickaasadanand" },
  { name: "Mridul Tiwari", instagram: "themridul_" },
  { name: "Nagma Mirajkar", instagram: "nagmamirajkar" },
  { name: "Natalia Janoszek", instagram: "nataliajanoszek" },
  { name: "Neelam Giri", instagram: "neelamgiri_" },
  { name: "Nehal Chudasama", instagram: "nehalchudasama9" },
  { name: "Pranit More", instagram: "rj_pranit" },
  { name: "Shehbaz Badesha", instagram: "badeshashehbaz" },
  { name: "Tanya Mittal", instagram: "tanyamittalofficial" },
  { name: "Zeishan Quadri", instagram: "zeishanquadri83" }
];

// === GENERAL FUNCTIONS ===
function createContestantCard(name) {
  const card = document.createElement("div");
  card.className = "contestant-card";

  let imgSrc = "";
  if (name === "No Elimination") {
    imgSrc = "Contestant/No Elimination.jpg";
  } else if (name === "Double Elimination") {
    imgSrc = "Contestant/Double Elimination.jpg";
  } else {
    imgSrc = "Contestant/" + name + ".jpg";
  }

  card.innerHTML = `
    <img src="${imgSrc}" alt="${name}">
    <h3>${name}</h3>
  `;
  return card;
}

// === ADMIN PANEL LOGIC ===
const adminContainer = document.getElementById("admin-contestants");
const saveBtn = document.getElementById("save-nominations");

const loadNominationsBtn = document.getElementById("loadNominationsBtn");
const winnerSelectionContainer = document.getElementById("admin-winner-selection");
const confirmWinnerBtn = document.getElementById("confirmWinnerBtn");

const setDeadlineInput = document.getElementById("setDeadlineInput");
const setDeadlineBtn = document.getElementById("setDeadlineBtn");
const currentDeadlineEl = document.getElementById("currentDeadline");

const deletePredictionsBtn = document.getElementById("deletePredictionsBtn");

if (adminContainer) {
  const nominationContestants = [
    "Abhishek Bajaj","Amaal Mallik","Ashnoor Kaur","Awez Darbar",
    "Baseer Ali","Farhana Bhatt","Gaurav Khanna","Kunickaa Sadanand",
    "Mridul Tiwari","Nagma Mirajkar","Natalia Janoszek","Neelam Giri",
    "Nehal Chudasama","Pranit More","Shehbaz Badesha","Tanya Mittal","Zeishan Quadri",
    "No Elimination", "Double Elimination"
  ];

  nominationContestants.forEach(name => {
    const card = createContestantCard(name);
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
    });
    adminContainer.appendChild(card);
  });

  saveBtn.addEventListener("click", () => {
    const storedDeadline = localStorage.getItem("deadline");
    if (!storedDeadline) {
      alert("⚠️ Please set a prediction deadline before saving nominations!");
      return;
    }

    const selected = [];
    document.querySelectorAll("#admin-contestants .contestant-card.selected h3").forEach(el => selected.push(el.textContent));
    localStorage.setItem("nominations", JSON.stringify(selected));
    alert("✅ Nominations saved successfully!");
  });

  // Load Nominations for Winner Selection
  loadNominationsBtn?.addEventListener("click", () => {
    winnerSelectionContainer.innerHTML = ""; // Clear existing cards
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    nominations.forEach(name => {
      const card = createContestantCard(name);
      card.addEventListener("click", () => {
        document.querySelectorAll("#admin-winner-selection .contestant-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
      });
      winnerSelectionContainer.appendChild(card);
    });
  });

  confirmWinnerBtn?.addEventListener("click", () => {
    const selectedWinner = document.querySelector("#admin-winner-selection .contestant-card.selected h3");
    if (selectedWinner) {
      localStorage.setItem("winner", selectedWinner.textContent);
      alert(`👑 Winner confirmed as ${selectedWinner.textContent}!`);
    } else {
      alert("Please select a winner before confirming.");
    }
  });

  // Deadline Management Logic
  const storedDeadline = localStorage.getItem("deadline");
  if (storedDeadline) {
    currentDeadlineEl.textContent = new Date(parseInt(storedDeadline)).toLocaleString();
  }

  setDeadlineBtn?.addEventListener("click", () => {
    const newDeadline = new Date(setDeadlineInput.value);
    if (newDeadline.toString() !== "Invalid Date") {
      localStorage.setItem("deadline", newDeadline.getTime());
      currentDeadlineEl.textContent = newDeadline.toLocaleString();
      alert("⏳ New prediction deadline set!");
    } else {
      alert("Please enter a valid date and time.");
    }
  });

  // Delete Predictions Logic
  deletePredictionsBtn?.addEventListener("click", () => {
    localStorage.removeItem("final_prediction");
    alert("🗑️ User predictions have been deleted!");
  });
}

// === PREDICTION PAGE LOGIC ===
const predictContainer = document.getElementById("prediction-options");
const submitPredictionBtn = document.getElementById("submitPrediction");

if (predictContainer) {
  const deadline = localStorage.getItem("deadline");
  const now = new Date().getTime();
  const userPrediction = localStorage.getItem("userPrediction");

  if (deadline && now < parseInt(deadline)) {
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    nominations.forEach(name => {
      const card = createContestantCard(name);
      predictContainer.appendChild(card);

      // Check if user has already voted
      if (userPrediction) {
        if (name === userPrediction) {
          card.classList.add("predicted-card");
        }
      } else {
        // Add click listener only if user hasn't voted
        card.addEventListener("click", () => {
          document.querySelectorAll(".contestant-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
        });
      }
    });

    // Handle submit button state
    if (userPrediction) {
      submitPredictionBtn.disabled = true;
      submitPredictionBtn.textContent = "Prediction Submitted ✅";
    } else {
      submitPredictionBtn.addEventListener("click", () => {
        const selectedPrediction = document.querySelector(".contestant-card.selected h3");
        if (selectedPrediction) {
          localStorage.setItem("userPrediction", selectedPrediction.textContent);
          alert("Prediction submitted! Thanks for participating! 🎉");
          // Reload page to update UI
          window.location.reload();
        } else {
          alert("Please select a contestant before submitting your prediction.");
        }
      });
    }

  } else {
    predictContainer.innerHTML = "<p>Prediction submissions are currently closed.</p>";
    submitPredictionBtn.disabled = true;
  }
}

// === CONTESTANTS PAGE LOGIC ===
const contestantsList = document.getElementById("contestants-list");
if (contestantsList) {
  contestantData.forEach(contestant => {
    const instagramURL = `https://www.instagram.com/${contestant.instagram}`;
    const card = document.createElement("div");
    card.className = "contestant-card";
    card.innerHTML = `
      <a href="${instagramURL}" target="_blank">
        <img src="Contestant/${contestant.name}.jpg" alt="${contestant.name}">
        <h3>${contestant.name}</h3>
      </a>
    `;
    contestantsList.appendChild(card);
  });
}

// === COUNTDOWN ===
const countdownEl = document.getElementById("countdown");
if (countdownEl) {
  function updateCountdown() {
    const storedDeadline = localStorage.getItem("deadline");
    if (!storedDeadline) {
      countdownEl.textContent = "⏳ Deadline not set by admin.";
      return;
    }
    const deadline = parseInt(storedDeadline);
    const now = new Date().getTime();
    const diff = deadline - now;
    if (diff <= 0) {
      countdownEl.textContent = "Prediction closed! 🔒";
      return;
    }
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    countdownEl.textContent = `⏳ ${hrs}h ${mins}m ${secs}s left`;
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// === LEADERBOARD ===
const leaderboardBody = document.getElementById("leaderboardBody");
if (leaderboardBody) renderLeaderboard();

document.getElementById("sortBy")?.addEventListener("change", renderLeaderboard);
document.getElementById("searchBar")?.addEventListener("input", renderLeaderboard);

function renderLeaderboard() {
  if (!leaderboardBody) return;
  leaderboardBody.innerHTML = "";
  let data = [...leaderboardData];
  const sortBy = document.getElementById("sortBy").value;
  const search = document.getElementById("searchBar").value.toLowerCase();

  if (sortBy === "points") data.sort((a, b) => b.points - a.points);
  else data.sort((a, b) => a.name.localeCompare(b.name));

  data = data.filter(p => p.name.toLowerCase().includes(search));

  data.forEach((p, i) => {
    leaderboardBody.innerHTML += `<tr>
      <td>${i + 1}</td><td>${p.name}</td><td>${p.points}</td>
    </tr>`;
  });
}

const leaderboardData = [
  { name: "Alice", points: 150 }, { name: "Bob", points: 120 },
  { name: "Charlie", points: 180 }, { name: "David", points: 90 },
  { name: "Eve", points: 200 }, { name: "Frank", points: 110 }
];