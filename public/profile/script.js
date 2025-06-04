document.addEventListener('DOMContentLoaded', () => {
  let userDataGlobal;
  let userUidGlobal;

  // Function to get the username from the URL path
  function getUsernameFromPath() {
    const path = window.location.pathname.split('/');
    return path[path.length - 1];
  }

  // Function to update profile display
  function updateProfileDisplay(userData) {
    document.getElementById('profileUsername').textContent = userData.username;
    const profileEmail = document.getElementById('profileEmail');
    const profileName = document.getElementById('profileName');
    const profileGender = document.getElementById('profileGender');
    const profileSocialMedia = document.getElementById('profileSocialMedia');
    const profileDenomination = document.getElementById('profileDenomination');

    if (profileEmail) {
      profileEmail.textContent = userData.showEmail ? userData.email : 'Private';
    }

    if (profileName) {
      profileName.textContent = userData.showName ? userData.name : 'Private';
    }

    if (profileGender) {
      profileGender.textContent = userData.gender || 'Not Available';
    }

    if (profileSocialMedia) {
      if (userData.socialMediaType && userData.socialMedia) {
        let prefix;
        switch (userData.socialMediaType) {
          case 'Instagram':
            prefix = 'https://instagram.com/';
            break;
          case 'Github':
            prefix = 'https://github.com/';
            break;
          case 'Linktree':
            prefix = 'https://linktr.ee/';
            break;
          case 'X':
            prefix = 'https://x.com/';
            break;
        }
        profileSocialMedia.innerHTML = `<a href="${prefix}${userData.socialMedia}" target="_blank">${prefix}${userData.socialMedia}</a>`;
      } else {
        profileSocialMedia.textContent = 'Not Available';
      }
    }

    if (profileDenomination) {
      profileDenomination.textContent = userData.denomination || 'Not Available';
    }
  }

  // Function to fetch user profile data
  async function fetchUserProfile(profileUsername, user) {
    const usersRef = db.collection('users');
    try {
      const querySnapshot = await usersRef.where('username', '==', profileUsername).get();
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userDataGlobal = userData;
        userUidGlobal = userDoc.id;
        updateProfileDisplay(userData);

        if (user && user.uid === userDoc.id) {
          document.getElementById('editProfileButton').classList.remove('hidden');
          document.getElementById('editSettingsButton').classList.remove('hidden');
        }

        // Display heart count
        document.getElementById('heartCount').textContent = userData.hearts || 0;

        // Check if the current user has hearted this profile
        if (user) {
          const heartedSnapshot = await db.collection('hearts').where('profileId', '==', userDoc.id).where('userId', '==', user.uid).get();
          if (!heartedSnapshot.empty) {
            document.getElementById('heartButton').textContent = 'Unheart';
          }
        }
      } else {
        document.getElementById('profileInfo').innerHTML = '<p>No profile found for this user.</p>';
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  auth.onAuthStateChanged((user) => {
    const profileUsername = getUsernameFromPath();
    fetchUserProfile(profileUsername, user);

    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', () => {
        document.getElementById('profile').classList.add('hidden');
        document.getElementById('editProfile').classList.remove('hidden');

        // Pre-fill form with existing data
        db.collection('users').where('username', '==', profileUsername).get().then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            document.getElementById('editName').value = userData.name || '';
            document.getElementById('showName').checked = userData.showName || false;
            document.getElementById('editEmail').value = userData.email || '';
            document.getElementById('showEmail').checked = userData.showEmail || false;
            document.getElementById('editGender').value = userData.gender || '';
            document.getElementById('editSocialMediaType').value = userData.socialMediaType || 'None';
            updateSocialMediaPlaceholder(userData.socialMediaType, userData.socialMedia || '');
            document.getElementById('editDenomination').value = userData.denomination || '';
          }
        });
      });
    }

    const cancelEditProfileButton = document.getElementById('cancelEditProfile');
    if (cancelEditProfileButton) {
      cancelEditProfileButton.addEventListener('click', () => {
        document.getElementById('editProfile').classList.add('hidden');
        document.getElementById('profile').classList.remove('hidden');
      });
    }

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('editName').value;
        const showName = document.getElementById('showName').checked;
        const newEmail = document.getElementById('editEmail').value;
        const showEmail = document.getElementById('showEmail').checked;
        const newGender = document.getElementById('editGender').value;
        const newSocialMediaType = document.getElementById('editSocialMediaType').value;
        const newSocialMedia = document.getElementById('editSocialMedia').value.replace(/^(https:\/\/instagram\.com\/|https:\/\/github\.com\/|https:\/\/linktr\.ee\/|https:\/\/x\.com\/)/, '');
        const newDenomination = document.getElementById('editDenomination').value;

        const userDoc = db.collection('users').doc(user.uid);
        userDoc.update({
          name: newName,
          showName: showName,
          email: newEmail,
          showEmail: showEmail,
          gender: newGender,
          socialMediaType: newSocialMediaType,
          socialMedia: newSocialMedia,
          denomination: newDenomination
        }).then(() => {
          document.getElementById('editProfile').classList.add('hidden');
          document.getElementById('profile').classList.remove('hidden');
          fetchUserProfile(getUsernameFromPath(), user);
        }).catch((error) => {
          console.error('Error updating profile:', error);
        });
      });
    }

    const editSettingsButton = document.getElementById('editSettingsButton');
    if (editSettingsButton) {
      editSettingsButton.addEventListener('click', () => {
        document.getElementById('profile').classList.add('hidden');
        document.getElementById('editSettings').classList.remove('hidden');
      });
    }

    const cancelEditSettingsButton = document.getElementById('cancelEditSettings');
    if (cancelEditSettingsButton) {
      cancelEditSettingsButton.addEventListener('click', () => {
        document.getElementById('editSettings').classList.add('hidden');
        document.getElementById('profile').classList.remove('hidden');
      });
    }

    const editSettingsForm = document.getElementById('editSettingsForm');
    if (editSettingsForm) {
      editSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('editUsername').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        user.reauthenticateWithCredential(credential).then(() => {
          if (newUsername) {
            db.collection('users').doc(user.uid).update({
              username: newUsername,
            }).then(() => {
              window.location.href = `/profile/${newUsername}`;
            }).catch((error) => {
              console.error('Error updating username:', error);
            });
          }

          if (newPassword && newPassword === confirmPassword) {
            user.updatePassword(newPassword).then(() => {
              document.getElementById('editSettingsForm').classList.add('hidden');
              document.getElementById('profile').classList.remove('hidden');
            }).catch((error) => {
              console.error('Error updating password:', error);
            });
          }
        }).catch((error) => {
          console.error('Error reauthenticating:', error);
        });
      });
    }

    const checkUsernameAvailabilityButton = document.getElementById('checkUsernameAvailability');
    if (checkUsernameAvailabilityButton) {
      checkUsernameAvailabilityButton.addEventListener('click', async () => {
        const newUsername = document.getElementById('editUsername').value;
        if (newUsername) {
          const usersRef = db.collection('users');
          const querySnapshot = await usersRef.where('username', '==', newUsername).get();
          const usernameAvailability = document.getElementById('usernameAvailability');
          if (querySnapshot.empty) {
            usernameAvailability.textContent = 'Username is available';
            usernameAvailability.style.color = 'green';
          } else {
            usernameAvailability.textContent = 'Username is taken';
            usernameAvailability.style.color = 'red';
          }
        }
      });
    }

    const heartButton = document.getElementById('heartButton');
    if (heartButton) {
      heartButton.addEventListener('click', async () => {
        if (user) {
          const heartsRef = db.collection('hearts');
          const userHeartSnapshot = await heartsRef.where('profileId', '==', userUidGlobal).where('userId', '==', user.uid).get();
          if (userHeartSnapshot.empty) {
            // Add heart
            await heartsRef.add({
              profileId: userUidGlobal,
              userId: user.uid,
            });
            await db.collection('users').doc(userUidGlobal).update({
              hearts: firebase.firestore.FieldValue.increment(1),
            });
            document.getElementById('heartButton').textContent = 'Unheart';
            document.getElementById('heartCount').textContent = parseInt(document.getElementById('heartCount').textContent) + 1;
          } else {
            // Remove heart
            userHeartSnapshot.docs[0].ref.delete();
            await db.collection('users').doc(userUidGlobal).update({
              hearts: firebase.firestore.FieldValue.increment(-1),
            });
            document.getElementById('heartButton').textContent = 'Heart';
            document.getElementById('heartCount').textContent = parseInt(document.getElementById('heartCount').textContent) - 1;
          }
        } else {
          alert('You must be logged in to heart profiles.');
        }
      });
    }

    updateNavLinks(user);
  });

  async function loadDenominations() {
    try {
      const response = await fetch('../denominations.json'); // Ensure the correct path to the JSON file
      const data = await response.json();
      const denominations = data.denominations;
      const editDenominationSelect = document.getElementById('editDenomination');

      denominations.forEach(denomination => {
        const option = document.createElement('option');
        option.value = denomination;
        option.textContent = denomination;
        editDenominationSelect.appendChild(option);
      });

      const nonDenominationOption = document.createElement('option');
      nonDenominationOption.value = 'Non Denomination';
      nonDenominationOption.textContent = 'Non Denomination';
      editDenominationSelect.appendChild(nonDenominationOption);
    } catch (error) {
      console.error('Error fetching denominations:', error);
    }
  }

  function updateSocialMediaPlaceholder(selectedType, username = '') {
    const socialMediaInput = document.getElementById('editSocialMedia');
    let prefix;
    switch (selectedType) {
      case 'Instagram':
        prefix = 'https://instagram.com/';
        break;
      case 'Github':
        prefix = 'https://github.com/';
        break;
      case 'Linktree':
        prefix = 'https://linktr.ee/';
        break;
      case 'X':
        prefix = 'https://x.com/';
        break;
      default:
        prefix = '';
    }

    socialMediaInput.placeholder = prefix;
    socialMediaInput.disabled = selectedType === 'None';
    socialMediaInput.value = username ? username.replace(prefix, '') : ''; // Set only the username part if provided
  }

  const socialMediaTypeSelect = document.getElementById('editSocialMediaType');
  if (socialMediaTypeSelect) {
    socialMediaTypeSelect.addEventListener('change', () => {
      const selectedType = socialMediaTypeSelect.value;
      updateSocialMediaPlaceholder(selectedType);
    });
  }

  const changeUsernameCheckbox = document.getElementById('changeUsername');
  const changePasswordCheckbox = document.getElementById('changePassword');
  const usernameSection = document.getElementById('usernameSection');
  const passwordSection = document.getElementById('passwordSection');

  if (changeUsernameCheckbox) {
    changeUsernameCheckbox.addEventListener('change', () => {
      usernameSection.classList.toggle('hidden', !changeUsernameCheckbox.checked);
    });
  }

  if (changePasswordCheckbox) {
    changePasswordCheckbox.addEventListener('change', () => {
      passwordSection.classList.toggle('hidden', !changePasswordCheckbox.checked);
    });
  }

  loadDenominations();
});

function updateNavLinks(user) {
  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = '';

  if (user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const username = userData.username || user.email.split('@')[0];
        navLinks.innerHTML = `
          <li><a href="/testimony/${username}">Testimony</a></li>
          <li><a href="/profile/${username}">Profile</a></li>
          <li><a href="/search/index.html">Search</a></li>
          <li><a href="#" id="logoutButton">Logout</a></li>
        `;
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
          logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
              window.location.href = '/login/index.html';
            });
          });
        }
      }
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
  } else {
    navLinks.innerHTML = `
      <li><a href="/signup/index.html">Sign Up</a></li>
      <li><a href="/login/index.html">Login</a></li>
      <li><a href="/search/index.html">Search</a></li>
    `;
  }
}

const searchButton = document.getElementById('searchButton');
if (searchButton) {
  searchButton.addEventListener('click', () => {
    window.location.href = '/search/index.html';
  });
}

// Redirect to index on logo click
document.getElementById('branding').addEventListener('click', () => {
  window.location.href = '../index';
});

document.getElementById('password').addEventListener('input', function() {
  const password = this.value;

  document.getElementById('lowercase').style.color = /[a-z]/.test(password) ? 'green' : 'red';
  document.getElementById('uppercase').style.color = /[A-Z]/.test(password) ? 'green' : 'red';
  document.getElementById('number').style.color = /[0-9]/.test(password) ? 'green' : 'red';
  document.getElementById('length').style.color = password.length >= 8 ? 'green' : 'red';
});

document.getElementById('confirmPassword').addEventListener('input', function() {
  if (this.value !== document.getElementById('password').value) {
    document.getElementById('passwordMatch').textContent = 'Passwords do not match';
    document.getElementById('passwordMatch').style.color = 'red';
  } else {
    document.getElementById('passwordMatch').textContent = '';
  }
});
