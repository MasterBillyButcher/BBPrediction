import { sql } from "@vercel/postgres";
import { neon } from '@neondatabase/serverless';

// This line makes sure the API connects to your STORAGE_URL
// Vercel and Neon automatically handle this, but it's a good
// practice to explicitly set it for clarity and to prevent
// any connection issues with custom variable names.
const sql = neon(process.env.STORAGE_URL);

export default async function handler(req, res) {
  try {
    const { type, name, score, prediction, user_name } = req.body || req.query;

    if (req.method === 'POST') {
      if (type === 'leaderboard') {
        const result = await sql`
          INSERT INTO leaderboard (name, score) VALUES (${name}, ${score})
          ON CONFLICT (name) DO UPDATE SET score = leaderboard.score + EXCLUDED.score;
        `;
        return res.status(200).json(result.rows);
      }
      
      if (type === 'prediction') {
        await sql`
          INSERT INTO predictions (user_name, prediction) VALUES (${user_name}, ${prediction})
          ON CONFLICT (user_name) DO UPDATE SET prediction = EXCLUDED.prediction;
        `;
        return res.status(200).json({ success: true, message: 'Prediction saved successfully!' });
      }

    } else if (req.method === 'GET') {
      if (req.query.type === 'leaderboard') {
        const { rows } = await sql`SELECT * FROM leaderboard;`;
        return res.status(200).json(rows);
      } else if (req.query.type === 'predictions') {
        const { rows } = await sql`SELECT * FROM predictions;`;
        return res.status(200).json(rows);
      } else if (req.query.type === 'prediction' && req.query.user_name) {
        const { rows } = await sql`SELECT * FROM predictions WHERE user_name = ${req.query.user_name};`;
        if (rows.length > 0) {
          return res.status(200).json(rows[0]);
        } else {
          return res.status(404).json({ message: 'Prediction not found.' });
        }
      }

    } else if (req.method === 'DELETE') {
      if (req.body.type === 'predictions') {
        await sql`DELETE FROM predictions;`;
        return res.status(200).json({ success: true, message: 'Predictions deleted successfully!' });
      }

    }

    return res.status(400).json({ message: 'Invalid request' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}