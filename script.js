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

// === TWITCH AUTH & ADMIN LOGIC ===
const CLIENT_ID = 'wtecr95tk5eu66xeugoiph13ba69m9';
const REDIRECT_URI = 'http://127.0.0.1:5500/callback.html'; // Update this to your deployed URL
const SCOPES = 'user:read:email';
const ADMIN_USERNAME = 'bobmasterbillie';

async function fetchTwitchUser() {
  const token = localStorage.getItem('twitch_token');
  if (!token) return null;
  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    const data = await response.json();
    const user = data.data[0];
    localStorage.setItem('twitch_username', user.login);
    return {
      username: user.login,
      profileImageUrl: user.profile_image_url
    };
  } catch (error) {
    console.error("Twitch auth error:", error);
    localStorage.removeItem('twitch_token');
    localStorage.removeItem('twitch_username');
    return null;
  }
}

async function renderHomePage() {
  const mainContent = document.getElementById('main-content');
  const user = await fetchTwitchUser();

  if (user) {
    mainContent.innerHTML = `
      <div style="text-align: center; margin-top: 50px;">
        <img src="${user.profileImageUrl}" alt="User PFP" style="border-radius: 50%; width: 150px; height: 150px; border: 3px solid #39FF14; box-shadow: 0 0 10px #39FF14;">
        <h1 style="margin-top: 20px;">Welcome, <strong>${user.username}</strong>! 🎉</h1>
        <p style="max-width: 600px; margin: auto;">You are now logged in and ready to make your predictions. Use the navigation bar to get started.</p>
      </div>
    `;
  } else {
    mainContent.innerHTML = `
      <h1>🎉 Welcome to Bigg Boss 19 Prediction Game</h1>
      <p style="text-align:center; max-width:600px; margin:auto;">
        Login with Twitch to participate, predict weekly eliminations, and compete on the leaderboard.
      </p>
      <div class="button-container">
        <button id="twitchLoginBtn" class="btn">Login with Twitch</button>
      </div>
    `;
    document.getElementById('twitchLoginBtn')?.addEventListener('click', () => {
      window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
    });
  }
}

async function renderAdminPanel() {
  const adminMain = document.getElementById('admin-main');
  if (!adminMain) return;

  const user = await fetchTwitchUser();
  if (!user || user.username !== ADMIN_USERNAME) {
    adminMain.innerHTML = `
      <h1 style="color: red; text-align: center;">⛔ Permission Denied</h1>
      <p style="text-align: center;">You must be logged in as an administrator to view this page.</p>
      <div class="button-container">
        <button id="twitchLoginBtn" class="btn">Login with Twitch</button>
      </div>
    `;
    document.getElementById('twitchLoginBtn')?.addEventListener('click', () => {
      window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
    });
    return;
  }

  adminMain.innerHTML = `
    <h1>⚙️ Admin Panel</h1>

    <h2>Set Prediction Deadline</h2>
    <div class="admin-section">
      <p>Current Deadline: <span id="currentDeadline">Not Set</span></p>
      <input type="datetime-local" id="setDeadlineInput" class="admin-input">
      <button id="setDeadlineBtn" class="btn">Set Deadline</button>
    </div>

    <h2>Select Nominations</h2>
    <div class="contestants-grid" id="admin-contestants"></div>
    <div class="button-container">
      <button class="btn" id="save-nominations">💾 Save Nominations</button>
    </div>

    <h2>Confirm Elimination Winner</h2>
    <div class="admin-section">
      <button id="loadNominationsBtn" class="btn">Load Nominated Contestants</button>
      <div class="contestants-grid" id="admin-winner-selection"></div>
      <button id="confirmWinnerBtn" class="btn">👑 Confirm Winner</button>
    </div>

    <h2>Prediction Management</h2>
    <div class="button-container">
      <button id="deletePredictionsBtn" class="btn">🗑️ Delete User Predictions</button>
      <button id="cancelPredictionBtn" class="btn">❌ Cancel All Predictions</button>
    </div>
  `;

  // All event listeners for admin panel
  const adminContainer = document.getElementById("admin-contestants");
  const saveBtn = document.getElementById("save-nominations");
  const loadNominationsBtn = document.getElementById("loadNominationsBtn");
  const winnerSelectionContainer = document.getElementById("admin-winner-selection");
  const confirmWinnerBtn = document.getElementById("confirmWinnerBtn");
  const setDeadlineInput = document.getElementById("setDeadlineInput");
  const setDeadlineBtn = document.getElementById("setDeadlineBtn");
  const currentDeadlineEl = document.getElementById("currentDeadline");
  const deletePredictionsBtn = document.getElementById("deletePredictionsBtn");
  const cancelPredictionBtn = document.getElementById("cancelPredictionBtn");

  // Nomination Logic
  const nominationContestants = [
    ...contestantData.map(c => c.name),
    "No Elimination",
    "Double Elimination"
  ];

  nominationContestants.forEach(name => {
    const card = createContestantCard(name);
    card.addEventListener("click", () => card.classList.toggle("selected"));
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
    winnerSelectionContainer.innerHTML = "";
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

  // Confirm Winner
  confirmWinnerBtn?.addEventListener("click", () => {
    const selectedWinner = document.querySelector("#admin-winner-selection .contestant-card.selected h3");
    if (selectedWinner) {
      localStorage.setItem("winner", selectedWinner.textContent);
      alert(`👑 Winner confirmed as ${selectedWinner.textContent}!`);
    } else {
      alert("Please select a winner before confirming.");
    }
  });

  // Deadline Management
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

  // Delete & Cancel Predictions
  deletePredictionsBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all user predictions? This cannot be undone.")) {
      localStorage.removeItem("userPrediction");
      alert("🗑️ User predictions have been deleted!");
      window.location.reload();
    }
  });

  cancelPredictionBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel the current prediction round? This will clear everything!")) {
      localStorage.removeItem("nominations");
      localStorage.removeItem("userPrediction");
      localStorage.removeItem("winner");
      localStorage.removeItem("deadline");
      alert("💥 Prediction round has been canceled!");
      window.location.reload();
    }
  });
}

// === GENERAL FUNCTIONS & PAGE LOGIC ===
function createContestantCard(name) {
  const card = document.createElement("div");
  card.className = "contestant-card";

  let imgSrc = "";
  if (name === "No Elimination") {
    imgSrc = "Contestant/No Elimination.jpg";
  } else if (name === "Double Elimination") {
    imgSrc = "Contestant/Double Elimination.jpg";
  } else {
    imgSrc = `Contestant/${name}.jpg`;
  }

  card.innerHTML = `
    <img src="${imgSrc}" alt="${name}">
    <h3>${name}</h3>
  `;
  return card;
}

// Prediction Page Logic
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

      if (userPrediction) {
        if (name === userPrediction) {
          card.classList.add("predicted-card");
        }
      } else {
        card.addEventListener("click", () => {
          document.querySelectorAll(".contestant-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
        });
      }
    });

    if (userPrediction) {
      submitPredictionBtn.disabled = true;
      submitPredictionBtn.textContent = "Prediction Submitted ✅";
    } else {
      submitPredictionBtn.addEventListener("click", () => {
        const selectedPrediction = document.querySelector(".contestant-card.selected h3");
        if (selectedPrediction) {
          localStorage.setItem("userPrediction", selectedPrediction.textContent);
          alert("Prediction submitted! Thanks for participating! 🎉");
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

// Contestants Page Logic
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

// Countdown
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

// Leaderboard
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

// Initial render for all pages
document.addEventListener('DOMContentLoaded', () => {
  // Check the current page and render the appropriate content
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    renderHomePage();
  } else if (window.location.pathname.endsWith('admin.html')) {
    renderAdminPanel();
  } else if (window.location.pathname.endsWith('contestants.html')) {
    // The contestants list is already rendered by the check outside the listener
  } else if (window.location.pathname.endsWith('predict.html')) {
    // The prediction logic is already triggered by the check outside the listener
  }
});