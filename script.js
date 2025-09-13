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
  card.className = "bg-gray-800 rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-300 hover:scale-105";

  let imgSrc = "";
  if (name === "No Elimination") {
    imgSrc = "Contestant/No Elimination.jpg";
  } else if (name === "Double Elimination") {
    imgSrc = "Contestant/Double Elimination.jpg";
  } else {
    imgSrc = `Contestant/${name}.jpg`;
  }

  card.innerHTML = `
    <img src="${imgSrc}" alt="${name}" class="w-full h-auto object-cover">
    <h3 class="p-4 text-center text-lg font-bold">${name}</h3>
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
      <div class="p-8 md:p-12 lg:p-16 bg-gray-900 rounded-2xl shadow-2xl border-2 border-green-500">
        <img src="${user.profileImageUrl}" alt="User PFP" class="mx-auto rounded-full w-32 h-32 md:w-40 md:h-40 border-4 border-green-400 shadow-lg mb-6">
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">Welcome, <strong class="text-green-400">${user.username}</strong>! 🎉</h1>
        <div class="flex flex-col sm:flex-row justify-center gap-6 mt-8">
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg flex-1">
                <h3 class="text-lg text-gray-400">Your Score</h3>
                <p class="text-4xl font-bold text-green-500 mt-2">${userScore}</p>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg flex-1">
                <h3 class="text-lg text-gray-400">Your Rank</h3>
                <p class="text-4xl font-bold text-green-500 mt-2">${userRank > 0 ? userRank : 'N/A'}</p>
            </div>
        </div>
        <p class="mt-8 text-lg text-gray-400 max-w-2xl mx-auto">You are now logged in and ready to make your predictions. Use the navigation bar to get started.</p>
        <div id="topTenLeaderboard" class="mt-12"></div>
      </div>
    `;
    renderTopTen();
  } else {
    mainContent.innerHTML = `
      <div class="p-8 md:p-12 lg:p-16 bg-gray-900 rounded-2xl shadow-2xl border-2 border-green-500">
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">🎉 Welcome to BB 19 Prediction Game</h1>
        <p class="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Login with Twitch to participate, predict weekly eliminations, and compete on the leaderboard.
        </p>
        <button id="twitchLoginBtn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105">Login with Twitch</button>
      </div>
    `;
    document.getElementById('twitchLoginBtn')?.addEventListener('click', () => {
      window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
    });
  }
}

async function fetchUserPrediction(username) {
  try {
    const response = await fetch(`/api/data?type=prediction&user_name=${username}`);
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
  const predictionText = document.getElementById("prediction-text");
  if (!predictContainer || !submitPredictionBtn || !predictionText) return;

  const deadline = localStorage.getItem("deadline");
  const now = new Date().getTime();
  const user = await fetchTwitchUser();

  if (!user) {
    predictContainer.innerHTML = "<p class='text-lg text-gray-400'>Please login with Twitch to make a prediction.</p>";
    submitPredictionBtn.style.display = 'none';
    predictionText.style.display = 'none'; // Hide the prediction text
    return;
  }

  const userPrediction = await fetchUserPrediction(user.username);

  if (deadline && now < parseInt(deadline)) {
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    predictionText.innerHTML = "Who will be eliminated? 🎯";
    predictionText.style.display = 'block';
    nominations.forEach(name => {
      const card = createContestantCard(name);
      predictContainer.appendChild(card);
      if (userPrediction && name === userPrediction) {
        card.classList.add("border-4", "border-blue-500", "shadow-blue-500");
      } else {
        card.addEventListener("click", () => {
          document.querySelectorAll("#prediction-options > div").forEach(c => c.classList.remove("border-4", "border-green-500", "shadow-green-500"));
          card.classList.add("border-4", "border-green-500", "shadow-green-500");
        });
      }
    });

    if (userPrediction) {
      submitPredictionBtn.disabled = true;
      submitPredictionBtn.textContent = "Prediction Submitted ✅";
      submitPredictionBtn.classList.remove("bg-green-500", "hover:bg-green-600");
      submitPredictionBtn.classList.add("bg-gray-500", "cursor-not-allowed");
    } else {
      submitPredictionBtn.addEventListener("click", async () => {
        const selectedPrediction = document.querySelector("#prediction-options > div.border-green-500 h3");
        if (selectedPrediction) {
          try {
            const response = await fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'prediction', user_name: user.username, prediction: selectedPrediction.textContent }),
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
    predictContainer.innerHTML = `<h2 class="text-xl md:text-2xl font-bold text-red-500 text-center">Prediction submissions are currently closed.</h2>`;
    submitPredictionBtn.style.display = 'none';
    predictionText.style.display = 'none'; // Hide the prediction text
  }
}

function renderContestantsPage() {
  const contestantsList = document.getElementById("contestants-list");
  if (!contestantsList) return;
  contestantData.forEach(contestant => {
    const instagramURL = `https://www.instagram.com/${contestant.instagram}`;
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-300 hover:scale-105";
    card.innerHTML = `
      <a href="${instagramURL}" target="_blank">
        <img src="Contestant/${contestant.name}.jpg" alt="${contestant.name}" class="w-full h-auto object-cover">
        <h3 class="p-4 text-center text-lg font-bold">${contestant.name}</h3>
      </a>
    `;
    contestantsList.appendChild(card);
  });
}

async function fetchLeaderboardData() {
  try {
    const response = await fetch('/api/data?type=leaderboard');
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

  filteredData.sort((a, b) => b.score - a.score);
  const search = document.getElementById("searchBar")?.value.toLowerCase() || "";
  filteredData = filteredData.filter(p => p.name.toLowerCase().includes(search));

  leaderboardBody.innerHTML = "";
  filteredData.forEach((p, i) => {
    leaderboardBody.innerHTML += `
        <tr class="bg-gray-900 even:bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${i + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${p.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-bold">${p.score}</td>
        </tr>
    `;
  });
}

async function updatePlayerScore(name, points) {
  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'leaderboard', name, score: points }),
    });
    if (!response.ok) throw new Error('Failed to update score');
    console.log('Score updated successfully!');
  } catch (error) {
    console.error("Score update error:", error);
  }
}

async function updateAllScores(eliminatedContestant) {
  try {
    const predictionsResponse = await fetch('/api/data?type=predictions');
    if (!predictionsResponse.ok) throw new Error('Failed to fetch predictions');
    const predictions = await predictionsResponse.json();

    const correctPredictors = predictions.filter(p => p.prediction === eliminatedContestant);

    if (correctPredictors.length > 0) {
      alert(`🎉 ${correctPredictors.length} player(s) predicted correctly! Updating scores...`);
    } else {
      alert("No one predicted correctly this week. 😟");
    }

    for (const player of correctPredictors) {
      await updatePlayerScore(player.user_name, 1);
    }

    alert("✅ All scores have been updated!");
  } catch (error) {
    console.error("Error updating scores:", error);
    alert("There was an error updating scores. Check the console for details.");
  }
}

async function renderAdminPanel() {
  const adminMain = document.getElementById('admin-main');
  if (!adminMain) return;
  const user = await fetchTwitchUser();
  if (!user || !ADMINS.includes(user.username)) {
    adminMain.innerHTML = `
      <div class="p-8 md:p-12 lg:p-16 bg-gray-900 rounded-2xl shadow-2xl border-2 border-red-500 mt-16 text-center">
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-red-500 mb-4">⛔ Permission Denied</h1>
        <p class="text-lg text-gray-400 max-w-2xl mx-auto mb-8">You must be logged in as an administrator to view this page.</p>
        <button id="twitchLoginBtn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105">Login with Twitch</button>
      </div>
    `;
    document.getElementById('twitchLoginBtn')?.addEventListener('click', () => {
      window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
    });
    return;
  }
  adminMain.innerHTML = `
    <h1 class="text-4xl md:text-5xl font-extrabold text-green-400 mb-8 mt-16 text-center">⚙️ Admin Panel</h1>

    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Set Prediction Deadline</h2>
        <p class="text-gray-400 mb-4">Current Deadline: <span id="currentDeadline" class="font-bold text-white">Not Set</span></p>
        <input type="datetime-local" id="setDeadlineInput" class="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
        <button id="setDeadlineBtn" class="w-full mt-4 bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-3 rounded-lg transition-colors">Set Deadline</button>
    </div>

    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Select Nominations</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6" id="admin-contestants"></div>
        <button id="save-nominations" class="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors">💾 Save Nominations</button>
    </div>

    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Confirm Elimination Winner</h2>
        <button id="loadNominationsBtn" class="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition-colors">Load Nominated Contestants</button>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4" id="admin-winner-selection"></div>
        <button id="confirmWinnerBtn" class="w-full mt-8 bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-3 rounded-lg transition-colors">👑 Confirm Winner</button>
    </div>

    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Prediction Management</h2>
        <div class="flex flex-col sm:flex-row gap-4">
            <button id="deletePredictionsBtn" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors">🗑️ Delete User Predictions</button>
            <button id="cancelPredictionBtn" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors">❌ Cancel All Predictions</button>
        </div>
    </div>
    
    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Manual Score Update</h2>
        <input type="text" id="playerNameInput" placeholder="Player Name" class="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4">
        <input type="number" id="playerScoreInput" placeholder="Points" class="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4">
        <button id="updateScoreBtn" class="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-3 rounded-lg transition-colors">Update Score</button>
    </div>

    <div class="bg-gray-900 p-8 rounded-xl shadow-2xl mb-8 border border-gray-700">
        <h2 class="text-2xl font-bold mb-4 text-green-400">Admin Privileges</h2>
        <input type="text" id="addAdminInput" placeholder="Twitch Username" class="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4">
        <button id="addAdminBtn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors">Grant Admin Access</button>
        <p class="mt-4 text-gray-400">Current Admins: <span id="currentAdmins" class="font-bold text-white"></span></p>
    </div>
  `;

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

  currentAdminsEl.textContent = ADMINS.join(', ');

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

  const nominationContestants = [
    ...contestantData.map(c => c.name),
    "No Elimination",
    "Double Elimination"
  ];
  nominationContestants.forEach(name => {
    const card = createContestantCard(name);
    card.addEventListener("click", () => {
        card.classList.toggle("border-green-500");
        card.classList.toggle("shadow-green-500");
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
    document.querySelectorAll("#admin-contestants > div.border-green-500 h3").forEach(el => selected.push(el.textContent));
    localStorage.setItem("nominations", JSON.stringify(selected));
    alert("✅ Nominations saved successfully!");
  });

  loadNominationsBtn?.addEventListener("click", () => {
    winnerSelectionContainer.innerHTML = "";
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    nominations.forEach(name => {
      const card = createContestantCard(name);
      card.addEventListener("click", () => {
        document.querySelectorAll("#admin-winner-selection > div").forEach(c => c.classList.remove("border-4", "border-green-500", "shadow-green-500"));
        card.classList.add("border-4", "border-green-500", "shadow-green-500");
      });
      winnerSelectionContainer.appendChild(card);
    });
  });

  confirmWinnerBtn?.addEventListener("click", async () => {
    const selectedWinner = document.querySelector("#admin-winner-selection > div.border-green-500 h3");
    if (selectedWinner) {
      const winnerName = selectedWinner.textContent;
      localStorage.setItem("winner", winnerName);
      await updateAllScores(winnerName);
      alert(`👑 Winner confirmed as ${winnerName}! Scores have been updated.`);
      window.location.reload();
    } else {
      alert("Please select a winner before confirming.");
    }
  });

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

  deletePredictionsBtn?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete all user predictions? This cannot be undone.")) {
      try {
        const response = await fetch('/api/data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'predictions' })
        });
        if (!response.ok) throw new Error('Failed to delete predictions');
        alert("🗑️ User predictions have been deleted!");
        window.location.reload();
      } catch (error) {
        console.error("Delete predictions error:", error);
        alert("There was an error deleting predictions.");
      }
    }
  });

  cancelPredictionBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel the current prediction round? This will clear everything!")) {
      localStorage.removeItem("nominations");
      localStorage.removeItem("winner");
      localStorage.removeItem("deadline");
      alert("💥 Prediction round has been canceled!");
      window.location.reload();
    }
  });

  updateScoreBtn?.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    const score = parseInt(playerScoreInput.value);
    if (name && !isNaN(score)) {
      await updatePlayerScore(name, score);
      alert(`Score for ${name} updated successfully!`);
      playerNameInput.value = "";
      playerScoreInput.value = "";
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
    topTenContainer.innerHTML = "<h2 class='text-xl text-gray-400'>No scores to display yet.</h2>";
    return;
  }
  topTenContainer.innerHTML = `
    <h2 class="text-3xl font-bold text-white mb-6">Top 10 Players 🏆</h2>
    <div class="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <table class="min-w-full divide-y divide-gray-700">
            <thead class="bg-gray-800">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Rank</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Player</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Points</th>
                </tr>
            </thead>
            <tbody class="bg-gray-900 divide-y divide-gray-800">
                ${topTen.map((p, i) => `
                    <tr class="even:bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${i + 1}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${p.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-bold">${p.score}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
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