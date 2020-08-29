import * as express from 'express';
import { User } from '../../entities/User';
import argon2 from 'argon2';
import { getConnection, getRepository } from 'typeorm';
import _ from 'lodash';

const router = express.Router();

// get route
router.post('/', async (req: express.Request, res: express.Response) => {
  const body = req.body;
  const username = body.username;
  const password = body.password;
  const desc = body.description;
  const email = body.email;
  const unique = body.unique;

  // TODO use express-validator or similar package to perform request validations
  if (password.length <= 2) {
    res.send('Password too short');
  }

  try {
    const hashedPassword = await argon2.hash(password);
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { username } });
    if (user) return res.status(409).json({ message: `Username ${username} already exists` });

    const savedUser = await userRepository.save(new User(username, hashedPassword, desc, email, unique));
    return res.json({ data: _.omit(savedUser, ['password', 'createdAt', 'updatedAt']) });
  } catch (err) {
    console.error(err);
    return res.status(500).json();
  }

  // TODO uncomment once front end is able to make request (this is will create a session for the user)
  // req.session.userId = user.id

  // TODO delete once front end is able to make request (dont want the front end to access the user obv)
  // res.send(user);
});

module.exports = router;
