const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db/connection');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const name = profile.displayName;
          const googleId = profile.id;
          const profilePic = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          // 1. Check if user with that google_id already exists in PostgreSQL
          const googleUserRes = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
          let user = googleUserRes.rows[0];

          if (user) {
            return done(null, user);
          }

          // 2. If no google_id match, check if user with that email already exists
          const emailUserRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
          user = emailUserRes.rows[0];

          if (user) {
            // Link Google account to existing local user account if not already linked
            const updateRes = await db.query(
              `UPDATE users 
               SET google_id = $1, profile_picture = COALESCE(profile_picture, $2) 
               WHERE id = $3 RETURNING *`,
              [googleId, profilePic, user.id]
            );
            user = updateRes.rows[0];
          } else {
            // 3. Create new user row
            const insertRes = await db.query(
              `INSERT INTO users (name, email, google_id, profile_picture, is_new_user) 
               VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
              [name, email, googleId, profilePic]
            );
            user = insertRes.rows[0];
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('WARNING: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not defined in .env. Real Google OAuth is disabled; mock flow will be used.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, userRes.rows[0]);
  } catch (error) {
    done(error, null);
  }
});
