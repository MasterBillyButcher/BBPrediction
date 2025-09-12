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
const REDIRECT_URI = 'https://bb-prediction.vercel.app/callback.html';
const SCOPES = 'user:read:email';
let ADMINS = ['bobmasterbillie'];

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

// Function to handle showing/hiding the admin link
async function handleAdminNav() {
  const adminLink = document.getElementById('adminLink');
  if (!adminLink) return;

  const user = await fetchTwitchUser();
  if (user && ADMINS.includes(user.username)) {
    adminLink.style.display = 'block';
  } else {
    adminLink.style.display = 'none';
  }
}

// === PAGE RENDERING FUNCTIONS ===
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

async function renderHomePage() {
  const mainContent = document.getElementById('main-content');
  const user = await fetchTwitchUser();
  const leaderboardData = await fetchLeaderboardData();

  if (user) {
    const userScore = leaderboardData.find(p => p.name === user.username)?.score || 0;
    const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);
    const userRank = sortedLeaderboard.findIndex(p => p.name === user.username) + 1;

    mainContent.innerHTML = `
      <div style="text-align: center; margin-top: 50px;">
        <img src="${user.profileImageUrl}" alt="User PFP" style="border-radius: 50%; width: 150px; height: 150px; border: 3px solid #39FF14; box-shadow: 0 0 10px #39FF14;">
        <h1 style="margin-top: 20px;">Welcome, <strong>${user.username}</strong>! 🎉</h1>
        <div class="user-stats">
            <div class="stat-card">
                <h3>Your Score</h3>
                <p class="stat-value">${userScore}</p>
            </div>
            <div class="stat-card">
                <h3>Your Rank</h3>
                <p class="stat-value">${userRank > 0 ? userRank : 'N/A'}</p>
            </div>
        </div>
        <p style="max-width: 600px; margin: auto;">You are now logged in and ready to make your predictions. Use the navigation bar to get started.</p>
        <div id="topTenLeaderboard" class="leaderboard-container"></div>
      </div>
    `;
    renderTopTen();
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


async function fetchUserPrediction(username) {
  try {
    const response = await fetch(`/api/predictions?user_name=${username}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch prediction');
    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error("Prediction fetch error:", error);
    return null;
  }
}

async function renderPredictionPage() {
  const predictContainer = document.getElementById("prediction-options");
  const submitPredictionBtn = document.getElementById("submitPrediction");
  if (!predictContainer || !submitPredictionBtn) return;
  const deadline = localStorage.getItem("deadline");
  const now = new Date().getTime();
  const user = await fetchTwitchUser();

  if (!user) {
    predictContainer.innerHTML = "<p>Please login with Twitch to make a prediction.</p>";
    submitPredictionBtn.style.display = 'none';
    return;
  }

  const userPrediction = await fetchUserPrediction(user.username);

  if (deadline && now < parseInt(deadline)) {
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    nominations.forEach(name => {
      const card = createContestantCard(name);
      predictContainer.appendChild(card);
      if (userPrediction && name === userPrediction) {
        card.classList.add("predicted-card");
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
      submitPredictionBtn.addEventListener("click", async () => {
        const selectedPrediction = document.querySelector(".contestant-card.selected h3");
        if (selectedPrediction) {
          try {
            const response = await fetch('/api/predictions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_name: user.username, prediction: selectedPrediction.textContent }),
            });
            if (!response.ok) throw new Error('Failed to save prediction');
            
            alert("Prediction submitted! Thanks for participating! 🎉");
            window.location.reload();
          } catch (error) {
            console.error("Prediction submission error:", error);
            alert("Error submitting prediction. Please try again.");
          }
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


function renderContestantsPage() {
  const contestantsList = document.getElementById("contestants-list");
  if (!contestantsList) return;
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

async function fetchLeaderboardData() {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }
}

async function renderLeaderboard() {
  const leaderboardBody = document.getElementById("leaderboardBody");
  if (!leaderboardBody) return;
  const data = await fetchLeaderboardData();
  let filteredData = [...data];
  const sortBy = document.getElementById("sortBy")?.value || "points";
  const search = document.getElementById("searchBar")?.value.toLowerCase() || "";
  if (sortBy === "points") filteredData.sort((a, b) => b.score - a.score);
  else filteredData.sort((a, b) => a.name.localeCompare(b.name));
  filteredData = filteredData.filter(p => p.name.toLowerCase().includes(search));
  leaderboardBody.innerHTML = "";
  filteredData.forEach((p, i) => {
    leaderboardBody.innerHTML += `<tr>
      <td>${i + 1}</td><td>${p.name}</td><td>${p.score}</td>
    </tr>`;
  });
}

// Function to update a player's score
async function updatePlayerScore(name, points, isManual) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: points, isManual }),
    });
    if (!response.ok) throw new Error('Failed to update score');
    console.log('Score updated successfully!');
  } catch (error) {
    console.error("Score update error:", error);
  }
}

// === NEW FUNCTION: Update scores for all correct predictions ===
async function updateAllScores(eliminatedContestant) {
  try {
    const predictionsResponse = await fetch('/api/predictions');
    if (!predictionsResponse.ok) throw new Error('Failed to fetch predictions');
    const predictions = await predictionsResponse.json();

    const correctPredictors = predictions.filter(p => p.prediction === eliminatedContestant);

    if (correctPredictors.length > 0) {
      alert(`🎉 ${correctPredictors.length} player(s) predicted correctly! Updating scores...`);
    } else {
      alert("No one predicted correctly this week. 😟");
    }

    // Now, update the score for each player who was correct
    for (const player of correctPredictors) {
      // Add 1 point for a correct prediction
      await updatePlayerScore(player.user_name, 1, false); 
    }

    alert("✅ All scores have been updated!");
    // Optional: clear predictions for the next round
    // await fetch('/api/predictions', { method: 'DELETE' });

  } catch (error) {
    console.error("Error updating scores:", error);
    alert("There was an error updating scores. Check the console for details.");
  }
}

// === PAGE RENDERING FUNCTIONS ===
async function renderAdminPanel() {
  const adminMain = document.getElementById('admin-main');
  if (!adminMain) return;
  const user = await fetchTwitchUser();
  if (!user || !ADMINS.includes(user.username)) {
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
    
    <h2>Manual Score Update</h2>
    <div class="admin-section">
      <p>Enter a player's name and points to update their score.</p>
      <input type="text" id="playerNameInput" placeholder="Player Name" class="admin-input">
      <input type="number" id="playerScoreInput" placeholder="Points" class="admin-input">
      <button id="updateScoreBtn" class="btn">Update Score</button>
    </div>

    <h2>Admin Privileges</h2>
    <div class="admin-section">
        <p>Enter a Twitch username to grant them admin privileges.</p>
        <input type="text" id="addAdminInput" placeholder="Twitch Username" class="admin-input">
        <button id="addAdminBtn" class="btn">Grant Admin Access</button>
        <p class="mt-2">Current Admins: <span id="currentAdmins"></span></p>
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
  const playerNameInput = document.getElementById("playerNameInput");
  const playerScoreInput = document.getElementById("playerScoreInput");
  const updateScoreBtn = document.getElementById("updateScoreBtn");
  const addAdminInput = document.getElementById("addAdminInput");
  const addAdminBtn = document.getElementById("addAdminBtn");
  const currentAdminsEl = document.getElementById("currentAdmins");

  // Display current admins
  currentAdminsEl.textContent = ADMINS.join(', ');

  // Admin Privilege Logic
  addAdminBtn.addEventListener('click', () => {
    const newAdmin = addAdminInput.value.trim();
    if (newAdmin && !ADMINS.includes(newAdmin)) {
      ADMINS.push(newAdmin);
      localStorage.setItem('admin_users', JSON.stringify(ADMINS));
      currentAdminsEl.textContent = ADMINS.join(', ');
      alert(`${newAdmin} has been granted admin privileges!`);
      addAdminInput.value = '';
    } else if (ADMINS.includes(newAdmin)) {
      alert(`${newAdmin} is already an admin.`);
    }
  });


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
  confirmWinnerBtn?.addEventListener("click", async () => {
    const selectedWinner = document.querySelector("#admin-winner-selection .contestant-card.selected h3");
    if (selectedWinner) {
      const winnerName = selectedWinner.textContent;
      localStorage.setItem("winner", winnerName); // Save the winner name locally for display purposes
      
      // === THIS IS THE NEW LOGIC ===
      // Update scores for everyone who got it right
      await updateAllScores(winnerName);
      // === END OF NEW LOGIC ===

      alert(`👑 Winner confirmed as ${winnerName}! Scores have been updated.`);
      window.location.reload();

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
      // localStorage.removeItem("userPrediction"); // This is no longer needed
      // TODO: Call API to delete all predictions from the database
      alert("🗑️ User predictions have been deleted!");
      window.location.reload();
    }
  });

  cancelPredictionBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel the current prediction round? This will clear everything!")) {
      localStorage.removeItem("nominations");
      // localStorage.removeItem("userPrediction"); // No longer needed
      localStorage.removeItem("winner");
      localStorage.removeItem("deadline");
      alert("💥 Prediction round has been canceled!");
      window.location.reload();
    }
  });

  // Manual Score Update Logic
  updateScoreBtn?.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    const score = parseInt(playerScoreInput.value);
    if (name && !isNaN(score)) {
      await updatePlayerScore(name, score, true); // True for manual update
      alert(`Score for ${name} updated successfully!`);
      playerNameInput.value = "";
      playerScoreInput.value = "";
      // Refresh the leaderboard on the admin page
      renderLeaderboard();
    } else {
      alert("Please enter a valid player name and a number for the score.");
    }
  });
}

async function renderTopTen() {
  const topTenContainer = document.getElementById('topTenLeaderboard');
  if (!topTenContainer) return;
  const data = await fetchLeaderboardData();
  const topTen = data.sort((a, b) => b.score - a.score).slice(0, 10);
  if (topTen.length === 0) {
    topTenContainer.innerHTML = "<h2>No scores to display yet.</h2>";
    return;
  }
  topTenContainer.innerHTML = `
    <h2>Top 10 Players 🏆</h2>
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        ${topTen.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${p.name}</td>
            <td>${p.score}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// === MAIN LOGIC: INITIALIZE ON PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  // Load admin users from local storage if they exist
  const storedAdmins = localStorage.getItem('admin_users');
  if (storedAdmins) {
    ADMINS = JSON.parse(storedAdmins);
  }

  handleAdminNav();
  const path = window.location.pathname;
  if (path.includes('index.html') || path === '/') {
    renderHomePage();
  } else if (path.includes('admin.html')) {
    renderAdminPanel();
  } else if (path.includes('predict.html')) {
    renderPredictionPage();
  } else if (path.includes('contestants.html')) {
    renderContestantsPage();
  } else if (path.includes('leaderboard.html')) {
    renderLeaderboard();
  }
});