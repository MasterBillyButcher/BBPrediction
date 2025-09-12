import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Fetch the leaderboard data from the database
      const { rows } = await sql`SELECT * FROM players ORDER BY score DESC;`;
      return res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to retrieve leaderboard data.' });
    }
  }

  if (req.method === 'POST') {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'Name and a valid score are required.' });
    }
    try {
      // Upsert: update score if player exists, otherwise insert new player
      await sql`
        INSERT INTO players (name, score)
        VALUES (${name}, ${score})
        ON CONFLICT (name) DO UPDATE SET score = players.score + EXCLUDED.score;
      `;
      return res.status(201).json({ message: 'Score updated successfully!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update score.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}