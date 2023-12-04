import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import ProfileTop from './ProfileTop';
import UserPost from './UserPost';
import { getProfileById , twoFAEnable, addFollower, UnFollow, deleteAccount } from '../../actions/profile';


const Profile = ({ getProfileById,twoFAEnable, deleteAccount, profile: { profile }, auth , addFollower, UnFollow}) => {
  const { id } = useParams();
  useEffect(() => {
    getProfileById(id);
  }, [getProfileById, id]);

  return (
    <section className="container">
      {profile === null ? (
        <Spinner />
      ) : (
        <Fragment>
          {auth.isAuthenticated &&
            auth.loading === false &&
            auth.user._id === profile._id && (
              <Link to="/edit-profile" className="btn btn-dark">
                Edit Profile
              </Link>
            )}
          <div className="profile-grid my-1">
            <ProfileTop profile={profile} />
            <div className="profile-follow bg-primary">
            {auth.isAuthenticated &&
              auth.loading === false &&
              auth.user._id !== profile._id && profile.followers.length > 0 && profile.followers.find(i => i.user === auth.user._id) && (
                <button
                    onClick={() => UnFollow(profile._id)}
                    type="button"
                    className="btn btn-dark"
                  >
                    UnFollow
                    {/* <span>{likes.length > 0 && <span>{likes.length}</span>}</span> */}
                  </button>
              )}
              {auth.isAuthenticated &&
              auth.loading === false &&
              auth.user._id !== profile._id && (!profile.followers.length || !profile.followers.find(i => i.user === auth.user._id)) &&  (
                <button
                    onClick={() => addFollower(profile._id)}
                    type="button"
                    className="btn btn-dark"
                  >
                    Follow
                    {/* <span>{likes.length > 0 && <span>{likes.length}</span>}</span> */}
                  </button>
              )}
            </div>
            <div className="border-bottom border-dark pt-4 mb-4"></div>
      <div id="2FABox" className="d-flex flex-column align-items-center gap-3">
        <button id="enable2FAButton" className="btn btn-success"  onClick={() => twoFAEnable()}>
          UPDATE/ENABLE 2FA
        </button>
        <div
          id="twoFAFormHolder"
          className="d-flex flex-column align-items-center gap-3"
        >
          <img id="qrImage" height="150" width="150" />
          <form id="twoFAUpdateForm" className="d-flex flex-column gap-2">
            <input
              type="text"
              name="code"
              placeholder="2 FA Code"
              className="form-control"
            />
            <button className="btn btn-primary" type="submit">SET</button>
            </form>
           


export default Profile;

        </div>
        </div>
          </div>
          <UserPost id={profile._id}/>

          {auth.isAuthenticated &&
            auth.loading === false &&
            auth.user._id === profile._id && (
              <div className="my-2">
                <button className="btn btn-danger" onClick={() => deleteAccount()}>
                  <i className="fas fa-user-minus" /> Delete My Account
                </button>
              </div>
            )}
        </Fragment>
      )}
    </section>
  );
};

Profile.propTypes = {
  getProfileById: PropTypes.func.isRequired,
  twoFAEnable: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  addFollower: PropTypes.func.isRequired,
  UnFollow : PropTypes.func.isRequired,
  deleteAccount: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  profile: state.profile,
  auth: state.auth
});

export default connect(mapStateToProps, { getProfileById,twoFAEnable, addFollower, UnFollow, deleteAccount })(Profile);
