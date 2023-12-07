const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');
const nodemailer = require("nodemailer");
const { logger } = require('../../logger');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');
const mongoose = require('mongoose');
const User = require('../../models/User');
//const Profile = require('../../models/Profile');
const checkObjectId = require('../../middleware/checkObjectId');

// @route    POST api/users
// @desc     Register user
// @access   Public
/**
 * @swagger
 * /users:
 *   post:
 *     tags: 
 *       - Users
 *     summary: Register user
 *     description: Register a new user in the application.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User registered successfully and profile created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid input or user already exists.
 */
router.post('/',
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        }),
        { forceHttps: true }
      );

      user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      user.role = "user"; 

      await user.save();

      const payload = {
        user: {
          _id: user.id
        }
      };

      // build a profile
      const profileFields = {
        user: user.id,
        status: "Active"
      };
      // try {
      //   // Using upsert option (creates new doc if no match is found):
      //   let profile = await Profile.findOneAndUpdate(
      //     { user: user.id },
      //     { $set: profileFields },
      //     { new: true, upsert: true, setDefaultsOnInsert: true }
      //   );
      
      // } catch (err) {
      //   console.error(err.message);
      //   return res.status(500).send('Server Error');
      // }
      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          logger.info('post user');
          res.json({ token , user});
        }
      );
    } catch (err) {
      console.error(err.message);
      logger.error('post user-err'+err.message);
      res.status(500).send('Server error');
    }
  }
);


router.get('/user/:user_id',auth ,
  checkObjectId('user_id'),
  async ({ params: { user_id } }, res) => {
    try {
      const profile = await User.findById(user_id);

      logger.info('get profile by id');
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      logger.info('get profile by id-err'+err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

router.get('/me' ,auth , async (req, res) => {
  try {
    const profile = await User.findOne({
      user: req.user._id
    });

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    logger.info('get profile me');
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    logger.error('get profile me'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve all user.
 *     responses:
 *       200:
 *         description: List of all user.
 *       500:
 *         description: Server error.
 */
router.get('/',auth , async (req, res) => {
  try {
    const profiles = await User.find();
    logger.info('get profile');
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    logger.error('get profile-err'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
/**
 * @swagger
 * /users/profile:
 *   post:
 *     tags:
 *       - Users
 *     security:
 *       - ApiKeyAuth: []
 *     summary: Update user 
 *     description: Update the logged-in user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               twitter:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               facebook:
 *                 type: string
 *               instagram:
 *                 type: string
 *    
 *     responses:
 *       200:
 *         description: Profile created or updated.
 *       400:
 *         description: Validation error.
 *       500:
 *         description: Server error.
 */
router.post('/profile', auth ,
  async (req, res) => {
    
    console.log("user"+JSON.stringify(req.user));
    // destructure the request
    const {
      website,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body;

    // build a profile
    const profileFields = {
      website:
        website && website !== ''
          ? normalize(website, { forceHttps: true })
          : '',
      ...rest
    };

    // Build socialFields object
    const socialFields = { youtube, twitter, instagram, linkedin, facebook };

    // normalize social fields to ensure valid url
    for (const [key, value] of Object.entries(socialFields)) {
      if (value && value.length > 0)
        socialFields[key] = normalize(value, { forceHttps: true });
    }
    // add to profileFields
    profileFields.social = socialFields;
    try {
      const filter = { _id: mongoose.Types.ObjectId(req.user._id) };
      const update = {
          $set: profileFields
      };
      // let newprofile = await User.findOneAndUpdate(
      //   { _id: mongoose.Types.ObjectId(req.user._id) },
      //   { $set: profileFields },
      //   { new: true, setDefaultsOnInsert: true }
      // );
      await User.updateOne(filter, update);
      const profile = await User.findById(req.user._id);
      logger.info('post profile');
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      logger.error('post profile-err'+err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/profile/follow/:id
// @desc     User click follow on id's profile then user Added in id's follower and id added in user's following
// @access   Private
router.put('/follow/:id' ,auth , checkObjectId('id'), async (req, res) => {
  try {
    const followprofile = await User.findById(req.params.id);
    const userid = await User.findById(req.user._id);
    
    followprofile.followers.unshift({ user: req.user._id });
    userid.following.unshift({ user: req.params.id });

    await followprofile.save();
    await userid.save();

    logger.info('follow user');
    return res.json(followprofile);
  } catch (err) {
    console.error(err.message);
    logger.error('follow user-err'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/unfollow/:id
// @desc     unfollow a post
// @access   Private
router.put('/unfollow/:id' ,auth , checkObjectId('id'), async (req, res) => {
  try {
    const Unfollowprofile = await User.findById(req.params.id);
    const userid = await User.findById(req.user._id);

    Unfollowprofile.followers = Unfollowprofile.followers.filter(
      ({ user }) => user.toString() !== req.user._id.toString()
    );
    // remove following
    userid.following = userid.following.filter(
      ({ user }) => user.toString() !== Unfollowprofile.user
    );

    await Unfollowprofile.save();
    await userid.save();
    logger.info('unfollow user');
    return res.json(Unfollowprofile);
  } catch (err) {
    console.error(err.message);
    logger.error('unfollow user-err'+err.message);
    res.status(500).send('Server Error');
  }
});
function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "krushika.nodemailer@gmail.com", // Your email
        pass: "sjdt sysk pufz xkun",  // Your email password
      },
    });
//sjdt sysk pufz xkun
    const mail_configs = {
      from: "krushika.nodemailer@gmail.com",
      to: recipient_email,
      subject: "Microblab PASSWORD RECOVERY",
      html: `<!DOCTYPE html>
            <html lang="en" >
            <head>
              <meta charset="UTF-8">
              <title>CodePen - OTP Email Template</title>
              

            </head>
            <body>
            <!-- partial:index.partial.html -->
            <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                  <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Microblab</a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Thank you for choosing Microblab. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
                <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                <p style="font-size:0.9em;">Regards,<br />Microblab</p>
                <hr style="border:none;border-top:1px solid #eee" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                  <p>Microblab</p>
                  <p>San Jose State University</p>
                  <p>California</p>
                </div>
              </div>
            </div>
            <!-- partial -->
              
            </body>
            </html>`,
                };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: "Email sent succesfuly" });
    });
  });
}

router.put('/sendcode' , async (req, res) => {
  try {
    let user = await User.findOne({ "email" : req.body.email });

    if (user) {
      await sendEmail({ recipient_email : req.body.email, OTP : req.body.otp})
      return res
          .status(200)
          .json({ Info: [{ msg: 'Code Sent' }] });
    }else{
      return res
          .status(400)
          .json({ errors: [{ msg: 'Email does not exist!' }] });
    }
  
  } catch (err) {
    console.error(err.message);
    logger.error('sendcode user-err'+err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/resetpassword',
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }

      const payload = {
        user: {
          _id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          logger.info('post user');
          res.json({ token , user});
        }
      );
    } catch (err) {
      console.error(err.message);
      logger.error('post user-err'+err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;