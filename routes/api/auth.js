const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const { logger } = require('../../logger');
const { authenticator } = require("otplib");
const User = require('../../models/User');

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    logger.info('get auth');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    logger.error('get auth'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
/**
 * @swagger
 * /auth:
 *   post:
 *     tags:
 *      - Users
 *     summary: User login
 *     description: This route logs in a user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *       400:
 *         description: Bad request.
 */
router.post(
  '/',
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, code } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      if (user.twoFA.enabled) {
        if (!code)
          return res
          .status(400)
          .json({ errors: [{ msg: '2FA Code Requested' }] });
          // return res.json({
          //   codeRequested: true,
          // });
        const verified = authenticator.check(code, user["twoFA"].secret);
        if (!verified) throw false;
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          logger.info('post auth');
          res.json({ token , user});
        }
      );
    } catch (err) {
      console.error(err.message);
      logger.error('auth error'+err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
