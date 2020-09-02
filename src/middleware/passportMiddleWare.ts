import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github';
import { GITHUB } from '../config/OAuthConfig';

passport.serializeUser((user: any, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  cb(null, id);
});

passport.use(
  new GithubStrategy(
    {
      clientID: GITHUB.clientID,
      clientSecret: GITHUB.clientSecret,
      callbackURL: GITHUB.callbackURL
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      return cb(null, profile);
    }
  )
);

export default passport;
