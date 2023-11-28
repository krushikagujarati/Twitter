const express = require('express');
const axios = require('axios');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { logger } = require('../../logger');
const { check, validationResult } = require('express-validator');
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require('normalize-url');
const checkObjectId = require('../../middleware/checkObjectId');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
/**
 * @swagger
 * /profile/me:
 *   get:
 *     security:
 *       - BearerAuth: []
 *     summary: Get current user's profile
 *     description: Retrieve the profile of the current logged-in user.
 *     responses:
 *       200:
 *         description: Profile data of the current user.
 *       500:
 *         description: Server error.
 */
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

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

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
/**
 * @swagger
 * /profile:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create or update user profile
 *     description: Create or update the profile of the logged-in user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twitter:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               location:
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
router.post(
  '/',
  auth,
  check('status', 'Status is required').notEmpty(),
  check('skills', 'Skills is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure the request
    const {
      website,
      skills,
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
      user: req.user.id,
      website:
        website && website !== ''
          ? normalize(website, { forceHttps: true })
          : '',
      skills: Array.isArray(skills)
        ? skills
        : skills.split(',').map((skill) => ' ' + skill.trim()),
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
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      logger.info('post profile');
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      logger.error('post profile-err'+err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get all profiles
 *     description: Retrieve all user profiles.
 *     responses:
 *       200:
 *         description: List of all user profiles.
 *       500:
 *         description: Server error.
 */
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    logger.info('get profile');
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    logger.error('get profile-err'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
/**
 * @swagger
 * /profile/user/{user_id}:
 *   get:
 *     security:
 *       - BearerAuth: []
 *     summary: Get profile by user ID
 *     description: Retrieve a user's profile by their user ID.
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: Unique ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile of the specified user.
 *       400:
 *         description: Profile not found.
 *       500:
 *         description: Server error.
 */
router.get(
  '/user/:user_id',
  checkObjectId('user_id'),
  async ({ params: { user_id } }, res) => {
    try {
      const profile = await Profile.findOne({
        user: user_id
      }).populate('user', ['name', 'avatar']);

      if (!profile) return res.status(400).json({ msg: 'Profile not found' });
      logger.info('get profile by id');
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      logger.info('get profile by id-err'+err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
/**
 * @swagger
 * /profile:
 *   delete:
 *     security:
 *       - BearerAuth: []
 *     summary: delete current user's profile
 *     description: delete the profile of the current logged-in user.
 *     responses:
 *       200:
 *         description: data deleted.
 *       500:
 *         description: Server error.
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    // Remove profile
    // Remove user
    await Promise.all([
      Post.deleteMany({ user: req.user.id }),
      Profile.findOneAndRemove({ user: req.user.id }),
      User.findOneAndRemove({ _id: req.user.id })
    ]);
    logger.info('user deleted');
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    logger.error('user deleted-err'+err.message);
    res.status(500).send('Server Error');
  }
});


// @route    PUT api/profile/follow/:id
// @desc     User click follow on id's profile then user Added in id's follower and id added in user's following
// @access   Private
router.put('/follow/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user', ['name', 'avatar']);
    const userid = await Profile.find({"user" : req.user.id});
    
    // Check if the user has already been followed
    // if (post.likes.some((like) => like.user.toString() === req.user.id)) {
    //   return res.status(400).json({ msg: 'Post already liked' });
    // }
    profile.followers.unshift({ user: req.user.id });
    userid[0].following.unshift({ user: profile.user });

    await profile.save();
    await userid[0].save();
    logger.info('follow user');
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    logger.error('follow user-err'+err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/unfollow/:id
// @desc     unfollow a post
// @access   Private
router.put('/unfollow/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user', ['name', 'avatar']);
    const userid = await Profile.find({"user" : req.user.id});
    

    // remove the follower
    profile.followers = profile.followers.filter(
      ({ user }) => user.toString() !== req.user.id
    );
    // remove following
    userid[0].following = userid[0].following.filter(
      ({ user }) => user.toString() !== profile.user
    );

    await profile.save();
    await userid[0].save();
    logger.info('unfollow user');
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    logger.error('unfollow user-err'+err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
