const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
//const redis = require('redis');
const { logger, morganMiddleware } = require('./logger');
const session = require('express-session');
const passport =require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config/default.json');
const cors = require('cors');
const User = require('./models/User');
const app = express();
const qrcode = require("qrcode");
const { authenticator } = require("otplib");
// Connect Database
connectDB();

// const redisClient = redis.createClient({
//     host: 'localhost', // or your Redis server host
//     port: 6379 // default Redis port
// });

// redisClient.on('error', (err) => console.log('Redis Client Error', err));

// redisClient.connect();


// Init Middleware
// app.use(express.json());
// app.use('/uploads', express.static(__dirname + '/uploads'));
// app.use(cookieParser());

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true, "Access-Control-Allow-Origin": "http://localhost:3000"
}));

// Define Routes

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize());
app.use(passport.session());



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 
app.use(morganMiddleware);

app.use('/api/users', require('./routes/api/users'));
//app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/upload', require('./routes/api/upload'));


passport.serializeUser((user, done) => {
  return done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, doc) => {
    //console.log("in deser==>"+doc)
    return done(null, doc);
  })
})


passport.use(new GoogleStrategy({
  clientID: config.GoogleClientId,
  clientSecret: config.GoogleClientSecret,
  callbackURL: "/auth/google/callback"
},
  function (request, accessToken, refreshToken, profile, done) {
    User.findOne({ googleId: profile.id }, async (err, doc) => {
      if (err) {
        return done(err, null);
      }
      if (!doc) {
        console.log(profile);
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          avatar: profile._json.picture//"https://www.shutterstock.com/image-vector/user-icon-trendy-flat-style-600nw-1467725033.jpg"
        });
        //console.log("p==>"+JSON.stringify(profile));
        await newUser.save();
        return done(null, newUser);
      }
      return done(null, doc);
    })

  }));

passport.use(new TwitterStrategy({
  consumerKey: config.TwitterconsumerKey,
  consumerSecret: config.TwitterconsumerSecret,
  callbackURL: "/auth/twitter/callback"
},
function (request, accessToken, refreshToken, profile, done) {

    User.findOne({ twitterId: profile.id }, async (err, doc) => {

      if (err) {
        return done(err, null);
      }

      if (!doc) {
        const newUser = new User({
          twitterId: profile.id,
          name: profile.displayName,
          avatar: profile._json.picture//"https://www.shutterstock.com/image-vector/user-icon-trendy-flat-style-600nw-1467725033.jpg"
        });

        await newUser.save();
        done(null, newUser);
      }
      done(null, doc);
    })

  }
));

passport.use(new GitHubStrategy({
  clientID: config.GitHubclientID,
  clientSecret: config.GitHubclientSecret,
  callbackURL: "/auth/github/callback"
},
function (request, accessToken, refreshToken, profile, done) {
    User.findOne({ githubId: profile.id }, async (err, doc) => {
      if (err) {
        return done(err, null);
      }
      if (!doc) {
        const newUser = new User({
          githubId: profile.id,
          name: profile.displayName,
          avatar: profile._json.picture// "https://www.shutterstock.com/image-vector/user-icon-trendy-flat-style-600nw-1467725033.jpg"
        });
        await newUser.save();
        done(null, newUser);
      }
      done(null, doc);
    })

  }
));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login', session: true }),
  function (req, res) {
    res.redirect('http://localhost:3000/posts');
  });


app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: 'http://localhost:3000/login', session: true }),
  function (req, res) {
    res.redirect('http://localhost:3000/posts');
  });


app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/login', session: true }),
  function (req, res) {
    res.redirect('http://localhost:3000/posts');
  });

app.get("/getuser", (req, res) => {
  res.send(req.user);
})


app.get("/auth/logout", (req, res) => {
  if (req.user) {
    req.logout();
    res.send("done");
  }
})

// generater QR Image
app.get("/api/qrImage", async (req, res) => {
  try {
    //console.log("reqUserIdtrace:", req.user._id);
    //const { id } = req.cookies;
    //console.log("idtrace:", id);
    const user = await User.findById(req.user._id);
    console.log("usertrace:", user);
    const secret = authenticator.generateSecret();
    console.log("Secrettrace:", secret);
    const uri = authenticator.keyuri(user._id, "2FA", secret);
    console.log("uritrace:", uri);
    const image = await qrcode.toDataURL(uri);
    console.log("imagetrace:", image);
    user["twoFA"].tempSecret = secret;
    await user.save();
    console.log("user after save:", user)
    try {
      const profile = await User.findById(req.user._id);
      console.log("profiletrace = ",profile)
      if (!profile) {
        return res.status(400).json({ msg: 'There is no profile for this user' });
      }
      logger.info('get profile me');
      //profile.image=image;
      user["twoFA"].qrImage = image;
      await user.save();
      return res.json(
       profile,
      );
        //res.json(profile);
    } catch (err) {
      console.error(err.message);}
    // return res.send({
    //   success: true,
    //   image,
    // });
  } catch {
    return res.status(500).send({
      success: false,
    });
  }
});

// set the 2 FA
app.get("/set2FA", async (req, res) => {
  try {
    //const { id } = req.cookies;
    //const { code } = req.query;
    const user = await User.findById(req.user._id);
    const { tempSecret } = user["2FA"];

    const verified = authenticator.check(code, tempSecret);
    if (!verified) throw false;

    user["2FA"] = {
      enabled: true,
      secret: tempSecret,
    };
    await user.save();
    return res.send({
      success: true,
    });
  } catch {
    return res.status(500).send({
      success: false,
    });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));


