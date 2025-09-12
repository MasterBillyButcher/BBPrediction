import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { type, name, score, isManual, user_name, prediction } = req.body || req.query;

  if (req.method === 'GET') {
    if (type === 'predictions') {
      const { rows } = await sql`SELECT user_name, prediction FROM predictions;`;
      return res.status(200).json(rows);
    }

    if (type === 'prediction' && user_name) {
      const { rows } = await sql`SELECT prediction FROM predictions WHERE user_name = ${user_name};`;
      if (rows.length > 0) {
        return res.status(200).json({ prediction: rows[0].prediction });
      } else {
        return res.status(404).json({ prediction: null });
      }
    }

    if (type === 'leaderboard') {
      const { rows } = await sql`SELECT name, score FROM leaderboard ORDER BY score DESC;`;
      return res.status(200).json(rows);
    }
  }

  if (req.method === 'POST') {
    if (type === 'prediction') {
      await sql`
        INSERT INTO predictions (user_name, prediction)
        VALUES (${user_name}, ${prediction})
        ON CONFLICT (user_name) DO UPDATE SET prediction = EXCLUDED.prediction;
      `;
      return res.status(201).json({ message: 'Prediction saved successfully!' });
    }

    if (type === 'leaderboard') {
      if (isManual) {
        await sql`
          INSERT INTO leaderboard (name, score)
          VALUES (${name}, ${score})
          ON CONFLICT (name) DO UPDATE SET score = EXCLUDED.score;
        `;
      } else {
        await sql`
          INSERT INTO leaderboard (name, score)
          VALUES (${name}, ${score})
          ON CONFLICT (name) DO UPDATE SET score = leaderboard.score + EXCLUDED.score;
        `;
      }
      return res.status(201).json({ message: 'Score updated successfully!' });
    }
  }

  if (req.method === 'DELETE') {
    if (type === 'predictions') {
      await sql`DELETE FROM predictions;`;
      return res.status(200).json({ message: 'All predictions deleted successfully.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}