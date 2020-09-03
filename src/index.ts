import 'reflect-metadata';
import connectRedis from 'connect-redis';
import 'dotenv-safe/config';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';

import morgan from 'morgan';
import path from 'path';
import passport from 'passport';
import { createConnection } from 'typeorm';
import { isAuthenticated } from './middleware/auth';
import { serverError } from './middleware/errors';
import { GITHUB, GOOGLE } from './config/OAuthConfig';
import passportMiddleware from './middleware/passportMiddleWare';

// Constants
import { COOKIE_NAME, __prod__ } from './constants';

// Entities
import Snippet from './entities/Snippet';
import User from './entities/User';

// Routes
const user = require('./controller/user/user');
const snippets = require('./controller/snippets/snippets');
const login = require('./controller/user/login');
const signup = require('./controller/user/signup');
const forgot = require('./controller/user/forgot');

const main = async () => {
  // Connect to postgres database
  await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [User, Snippet]
  });

  const app = express();

  // Redis setup
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 1, // 1 month
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie only works in https
        domain: __prod__ ? '.snippetserve.com' : undefined
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false
    })
  );

  app.use(express.json());

  // passport middleware
  app.use(passportMiddleware.initialize());
  app.use(passportMiddleware.session());

  // TODO oauth routes refactor this to another folder
  app.get('/auth/github', passport.authenticate('github'));
  app.get(GITHUB.callbackURL, passport.authenticate('github'), (req, res) => {
    res.redirect('/profile');
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'https://www.googleapis.com/auth/userinfo.email']
    })
  );

  app.get(
    GOOGLE.callbackURL,
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect('/profile');
    }
  );

  app.get('/profile', isAuthenticated, (req, res) => {
    res.json({ message: 'Welcome to your profile page', status: 200 });
  });

  app.get('/auth/logout', (req, res) => {
    // passportjs must have set uid etc, hence we need to perform a logout on request object
    req.logout();
    // we also need to clear the cookie
    res.clearCookie(COOKIE_NAME);
    // we need to destroy express-session which would delete the corresponding redis session as well
    req.session.destroy((err) => {
      console.error(err);
      res.redirect('/profile');
    });
  });

  app.use('/api/snippets', snippets);
  app.use('/api/user', user);
  app.use('/api/login', login);
  app.use('/api/signup', signup);
  app.use('/api/forgot', forgot);

  /*
  Fix for:
  body-parser deprecated undefined extended: provide extended option dist/index.js:69:31
  */
  app.use(express.urlencoded({ extended: true }));

  // Use morgan
  app.use(morgan('dev'));

  // For 404 pages
  app.use((req, res) => {
    res.status(404).json({ status: '404' });
  });

  app.use(serverError);

  // +str is shortform to convert a string to number
  app.listen(+process.env.PORT, () => {
    console.log(`Server started on localhost:${process.env.PORT}`);
  });
};

main();
