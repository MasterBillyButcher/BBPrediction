// Remove the old, static leaderboard data
// const leaderboardData = [...];

// New function to fetch data from the API
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

// Update the renderLeaderboard function
async function renderLeaderboard() {
  const leaderboardBody = document.getElementById("leaderboardBody");
  if (!leaderboardBody) return;

  const data = await fetchLeaderboardData();

  // The rest of your sorting and filtering logic remains the same
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
async function updatePlayerScore(name, points) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: points }),
    });
    if (!response.ok) throw new Error('Failed to update score');
    console.log('Score updated successfully!');
  } catch (error) {
    console.error("Score update error:", error);
  }
}