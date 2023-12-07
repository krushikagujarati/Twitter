const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  if(req.header('x-auth-token')){
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
      jwt.verify(token, process.env.jwtSecret , (error, decoded) => {
        if (error) {
          return res.status(401).json({ msg: 'Token is not valid' });
        } else {
          req.user = decoded.user;
          req.user._id = req.user.id;
          next();
        }
      });
    } catch (err) {
      console.error('something wrong with auth middleware');
      res.status(500).json({ msg: 'Server Error' });
    }
  }else{
    next();
  }
};
