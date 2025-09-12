// Sample data
const contestants = [
    "Abhishek Bajaj", "Amaal Mallik", "Ashnoor Kaur", "Awez Darbar",
    "Baseer Ali", "Farhana Bhatt", "Gaurav Khanna", "Kunickaa Sadanand",
    "Mridul Tiwari", "Nagma Mirajkar", "Natalia Janoszek", "Neelam Giri",
    "Nehal Chudasama", "Pranit More", "Shehbaz Badesha", "Tanya Mittal", "Zeishan Quadri"
];

const leaderboardData = [
  { name: "Alice", points: 150 }, { name: "Bob", points: 120 },
  { name: "Charlie", points: 180 }, { name: "David", points: 90 },
  { name: "Eve", points: 200 }, { name: "Frank", points: 110 }
];

// Helper function to create contestant cards
function createContestantCard(name, container, onClickHandler) {
  const card = document.createElement("div");
  card.className = "contestant-card";

  let imgSrc = `Contestant/${name}.jpg`;
  if (name === "No Elimination") imgSrc = "Contestant/NoElimination.jpg";
  if (name === "Double Elimination") imgSrc = "Contestant/DoubleElimination.jpg";

  card.innerHTML = `
    <img src="${imgSrc}" alt="${name}">
    <h3>${name}</h3>
  `;
  if (onClickHandler) {
    card.addEventListener("click", onClickHandler);
  }
  container.appendChild(card);
}

// Redirect to Twitch for login
function loginWithTwitch() {
  const CLIENT_ID = "YOUR_TWITCH_CLIENT_ID"; // Replace with your client ID
  const REDIRECT_URI = window.location.origin + "/callback.html";
  const SCOPES = "openid";
  const AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
  window.location.href = AUTH_URL;
}

// === GENERAL LOGIC & PAGE-SPECIFIC FUNCTIONS ===
document.addEventListener("DOMContentLoaded", () => {
    const page = window.location.pathname.split("/").pop();

    if (page === "admin.html") {
        setupAdminPanel();
    } else if (page === "predict.html") {
        setupPredictionPage();
    } else if (page === "leaderboard.html") {
        setupLeaderboard();
    } else if (page === "contestants.html") {
        setupContestantsPage();
    }
});

function setupAdminPanel() {
    const adminContainer = document.getElementById("admin-contestants");
    const saveNominationsBtn = document.getElementById("save-nominations");
    const deletePredictionBtn = document.getElementById("delete-prediction");
    const loadNomineesBtn = document.getElementById("load-nominees");
    const correctAnswerOptions = document.getElementById("correct-answer-options");
    const endDateInput = document.getElementById("end-date");
    const endTimeInput = document.getElementById("end-time");

    // Load existing settings
    const savedNominations = JSON.parse(localStorage.getItem("nominations")) || [];
    const savedDeadline = localStorage.getItem("deadline");
    if (savedDeadline) {
        const deadlineDate = new Date(savedDeadline);
        endDateInput.value = deadlineDate.toISOString().split("T")[0];
        endTimeInput.value = deadlineDate.toTimeString().split(" ")[0].substring(0, 5);
    }

    // Display contestant cards for nomination selection
    contestants.forEach(name => {
        createContestantCard(name, adminContainer, (e) => {
            e.currentTarget.classList.toggle("selected");
        });
    });

    // Add special options as cards
    createContestantCard("No Elimination", adminContainer, (e) => e.currentTarget.classList.toggle("selected"));
    createContestantCard("Double Elimination", adminContainer, (e) => e.currentTarget.classList.toggle("selected"));

    // Save nominations and deadline
    saveNominationsBtn.addEventListener("click", () => {
        const selected = [];
        document.querySelectorAll("#admin-contestants .contestant-card.selected h3").forEach(el => selected.push(el.textContent));
        const deadline = new Date(`${endDateInput.value}T${endTimeInput.value}:00`);

        if (selected.length === 0 || !endDateInput.value || !endTimeInput.value) {
            return alert("Please select nominees and set a valid date/time.");
        }

        localStorage.setItem("nominations", JSON.stringify(selected));
        localStorage.setItem("deadline", deadline.toISOString());
        alert("✅ Nominations and deadline saved successfully!");
    });

    // Delete current prediction data
    deletePredictionBtn.addEventListener("click", () => {
        localStorage.removeItem("nominations");
        localStorage.removeItem("prediction");
        localStorage.removeItem("correctAnswer");
        localStorage.removeItem("deadline");
        alert("🗑️ All prediction data deleted.");
        window.location.reload();
    });

    // Load nominees for correct answer selection
    loadNomineesBtn.addEventListener("click", () => {
        const nominations = JSON.parse(localStorage.getItem("nominations"));
        if (!nominations || nominations.length === 0) {
            return alert("No nominations saved. Please save nominations first.");
        }
        correctAnswerOptions.innerHTML = "";
        nominations.forEach(name => {
            createContestantCard(name, correctAnswerOptions, (e) => {
                document.querySelectorAll("#correct-answer-options .contestant-card").forEach(c => c.classList.remove("selected"));
                e.currentTarget.classList.add("selected");
                const correctAnswer = e.currentTarget.querySelector("h3").textContent;
                localStorage.setItem("correctAnswer", correctAnswer);
                alert(`✅ Correct answer set to: ${correctAnswer}`);
            });
        });
    });
}

function setupPredictionPage() {
    const predictContainer = document.getElementById("prediction-options");
    const submitBtn = document.getElementById("submitPrediction");
    const loginRequiredMsg = document.getElementById("login-required");
    const countdownEl = document.getElementById("countdown");

    const token = localStorage.getItem("twitch_token");
    const deadline = new Date(localStorage.getItem("deadline"));
    const now = Date.now();
    const nominations = JSON.parse(localStorage.getItem("nominations")) || [];
    const hasCorrectAnswer = localStorage.getItem("correctAnswer") !== null;
    
    // Check if user is logged in
    if (!token) {
        predictContainer.style.display = "none";
        submitBtn.style.display = "none";
        loginRequiredMsg.style.display = "block";
        countdownEl.textContent = "Please log in to make a prediction.";
        return;
    }

    // Check if correct answer is set
    if (hasCorrectAnswer) {
        const prediction = localStorage.getItem("prediction");
        const correctAnswer = localStorage.getItem("correctAnswer");
        predictContainer.innerHTML = "";
        const resultMessage = document.createElement("p");
        resultMessage.style.fontSize = "1.5rem";
        resultMessage.style.marginTop = "20px";
        
        if (prediction === correctAnswer) {
            resultMessage.textContent = `🎉 Congratulations! Your prediction was correct! The eliminated contestant was ${correctAnswer}.`;
        } else {
            resultMessage.textContent = `😢 You predicted ${prediction}, but the eliminated contestant was ${correctAnswer}. Better luck next time!`;
        }
        predictContainer.appendChild(resultMessage);
        return;
    }

    // Check if prediction is open
    if (now > deadline) {
        predictContainer.innerHTML = "<p>🔒 The prediction period has ended. Check back soon for the results!</p>";
        submitBtn.style.display = "none";
        countdownEl.textContent = "Prediction closed! 🔒";
        return;
    }

    // Prediction is open and user is logged in
    if (nominations.length === 0) {
        predictContainer.innerHTML = "<p>Nominees have not been set yet. Check back soon!</p>";
        submitBtn.style.display = "none";
        return;
    }

    nominations.forEach(name => {
        createContestantCard(name, predictContainer, (e) => {
            document.querySelectorAll("#prediction-options .contestant-card").forEach(c => c.classList.remove("selected"));
            e.currentTarget.classList.add("selected");
        });
    });

    const savedPrediction = localStorage.getItem("prediction");
    if (savedPrediction) {
      const card = document.querySelector(`#prediction-options .contestant-card h3`);
      if (card && card.textContent === savedPrediction) {
        card.parentNode.classList.add("selected");
      }
    }

    submitBtn.style.display = "block";
    submitBtn.addEventListener("click", () => {
        const selectedCard = document.querySelector("#prediction-options .contestant-card.selected h3");
        if (selectedCard) {
            localStorage.setItem("prediction", selectedCard.textContent);
            alert(`👍 You've predicted: ${selectedCard.textContent}`);
        } else {
            alert("Please select an option before submitting!");
        }
    });

    // Countdown Timer
    const timer = setInterval(() => {
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) {
            clearInterval(timer);
            countdownEl.textContent = "Prediction closed! 🔒";
            predictContainer.innerHTML = "<p>The prediction period has ended. Check back soon for the results!</p>";
            submitBtn.style.display = "none";
            return;
        }
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        countdownEl.textContent = `⏳ ${hrs}h ${mins}m ${secs}s left`;
    }, 1000);
}

function setupLeaderboard() {
    renderLeaderboard();
    document.getElementById("sortBy")?.addEventListener("change", renderLeaderboard);
    document.getElementById("searchBar")?.addEventListener("input", renderLeaderboard);
}

function renderLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = "";
    let data = [...leaderboardData];
    const sortBy = document.getElementById("sortBy").value;
    const search = document.getElementById("searchBar").value.toLowerCase();

    if (sortBy === "points") data.sort((a, b) => b.points - a.points);
    else data.sort((a, b) => a.name.localeCompare(b.name));

    data = data.filter(p => p.name.toLowerCase().includes(search));

    data.forEach((p, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.points}</td>
      `;
      leaderboardBody.appendChild(row);
    });
}

function setupContestantsPage() {
    const contestantsList = document.getElementById("contestants-list");
    contestants.forEach(name => {
      createContestantCard(name, contestantsList, null);
    });
}