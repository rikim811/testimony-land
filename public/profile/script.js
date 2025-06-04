document.addEventListener('DOMContentLoaded', () => {
  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileUsername = document.getElementById('profileUsername');
  const profileActions = document.getElementById('profileActions');
  const editForm = document.getElementById('editForm');
  const profileContent = document.getElementById('profileContent');

  let currentUser = null;
  let isOwnProfile = false;

  function getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  function updateProfile(userData) {
    profileName.textContent = userData.name;
    profileUsername.textContent = `@${userData.username}`;
    profileAvatar.textContent = getInitials(userData.name);
    
    // Update profile actions
    profileActions.innerHTML = '';
    if (isOwnProfile) {
      profileActions.innerHTML = `
        <button class="action-button primary-button" id="editProfileBtn">
          <i class="fas fa-edit"></i> Edit Profile
        </button>
      `;
      document.getElementById('editProfileBtn').addEventListener('click', showEditForm);
    }

    // Only show private profile content to the owner or if profile is not private
    if (isOwnProfile || !userData.privateProfile) {
      let contentHTML = `<div class="profile-content-grid">`;
      
      // Bio section (full width)
      contentHTML += `
        <div class="info-card" style="grid-column: 1 / -1">
          <label>Bio</label>
          <div class="content">${userData.bio || 'No bio added yet'}</div>
        </div>
      `;

      // Personal info cards
      if (userData.showAge && userData.age) {
        contentHTML += `
          <div class="info-card">
            <label>Age</label>
            <div class="content">${userData.age}</div>
          </div>
        `;
      }

      if (userData.showGender && userData.gender) {
        contentHTML += `
          <div class="info-card">
            <label>Gender</label>
            <div class="content">${userData.gender}</div>
          </div>
        `;
      }

      if (userData.showDenomination && userData.denomination) {
        contentHTML += `
          <div class="info-card">
            <label>Denomination</label>
            <div class="content">${userData.denomination}</div>
          </div>
        `;
      }

      // Social media card
      if (userData.socialMediaType && userData.socialMedia) {
        contentHTML += `
          <div class="info-card">
            <label>${userData.socialMediaType}</label>
            <div class="content">
              <a href="${getSocialMediaLink(userData.socialMediaType, userData.socialMedia)}" 
                 target="_blank" rel="noopener noreferrer">
                 @${userData.socialMedia}
              </a>
            </div>
          </div>
        `;
      }

      // Testimony link card
      contentHTML += `
        <div class="info-card">
          <label>Testimony</label>
          <div class="content">
            <a href="../testimony/${userData.username}" class="testimony-link">
              <i class="fas fa-book-open"></i> View Testimony
            </a>
          </div>
        </div>
      `;

      contentHTML += `</div>`;

      profileContent.innerHTML = contentHTML;

    } else {
      profileContent.innerHTML = `
        <div class="info-card" style="text-align: center;">
          <i class="fas fa-lock" style="font-size: 2em; color: #546bd6; margin-bottom: 15px;"></i>
          <p>This profile is private</p>
        </div>
      `;
    }
  }

  function getSocialMediaLink(platform, username) {
    const platforms = {
      'Instagram': `https://instagram.com/${username}`,
      'Twitter': `https://twitter.com/${username}`,
      'GitHub': `https://github.com/${username}`,
      'LinkedIn': `https://linkedin.com/in/${username}`,
      'Facebook': `https://facebook.com/${username}`,
      'YouTube': `https://youtube.com/@${username}`,
      'TikTok': `https://tiktok.com/@${username}`
    };
    return platforms[platform] || '#';
  }

  function showEditForm() {
    profileContent.style.display = 'none';
    editForm.style.display = 'block';
    
    // Populate form with current data
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editAge').value = currentUser.age || '';
    document.getElementById('editGender').value = currentUser.gender || '';
    document.getElementById('editDenomination').value = currentUser.denomination || '';
    document.getElementById('editSocialMediaType').value = currentUser.socialMediaType || '';
    document.getElementById('editSocialMedia').value = currentUser.socialMedia || '';
    
    // Checkboxes
    document.getElementById('editShowAge').checked = currentUser.showAge || false;
    document.getElementById('editShowGender').checked = currentUser.showGender || false;
    document.getElementById('editShowDenomination').checked = currentUser.showDenomination || false;
    document.getElementById('editPrivateProfile').checked = currentUser.privateProfile || false;
  }

  // Add event listeners for edit form
  document.getElementById('cancelEdit').addEventListener('click', () => {
    editForm.style.display = 'none';
    profileContent.style.display = 'block';
  });

  // Update the age input validation
  const ageInput = document.getElementById('editAge');
  ageInput.addEventListener('change', (e) => {
    let value = parseInt(e.target.value);
    if (value && value < 13) {
      e.target.value = 13;
    } else if (value && value > 120) {
      e.target.value = 120;
    }
  });

  // Add validation for username
  const usernameInput = document.getElementById('editUsername');
  if (usernameInput) { // Only if username is editable
    usernameInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const regex = /^[a-zA-Z0-9]{3,}$/;
      
      if (!regex.test(value)) {
        usernameInput.classList.add('invalid');
        document.getElementById('usernameError').textContent = 
          'Username must be at least 3 characters and contain only letters and numbers';
      } else {
        usernameInput.classList.remove('invalid');
        document.getElementById('usernameError').textContent = '';
      }
    });
  }

  // Update the save profile function to include validation
  document.getElementById('saveProfile').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const age = parseInt(document.getElementById('editAge').value);
    
    if (!name) {
      alert('Name is required');
      return;
    }

    if (age && (age < 13 || age > 120)) {
      alert('Age must be between 13 and 120');
      return;
    }

    const updates = {
      name: name,
      bio: document.getElementById('editBio').value.trim(),
      age: age || null,
      gender: document.getElementById('editGender').value,
      denomination: document.getElementById('editDenomination').value,
      socialMediaType: document.getElementById('editSocialMediaType').value,
      socialMedia: document.getElementById('editSocialMedia').value.trim(),
      showAge: document.getElementById('editShowAge').checked,
      showGender: document.getElementById('editShowGender').checked,
      showDenomination: document.getElementById('editShowDenomination').checked,
      privateProfile: document.getElementById('editPrivateProfile').checked,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('users').doc(currentUser.uid).update(updates);
      currentUser = { ...currentUser, ...updates };
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Profile updated successfully!';
      editForm.insertBefore(successMessage, editForm.firstChild);
      
      setTimeout(() => {
        successMessage.remove();
        editForm.style.display = 'none';
        profileContent.style.display = 'block';
        updateProfile(currentUser);
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  });

  // Add this function to handle navigation links
  function updateNavLinks(user) {
    const navLinks = document.getElementById('navLinks');
    if (user) {
      navLinks.innerHTML = `
        <li><a href="../testimony/${user.username}">Testimony</a></li>
        <li><a href="../profile/${user.username}">Profile</a></li>
        <li><a href="../search/index.html">Search</a></li>
        <li><a href="#" id="logoutButton">Logout</a></li>
      `;
      document.getElementById('logoutButton').addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = '../login/index.html';
        });
      });
    } else {
      navLinks.innerHTML = `
        <li><a href="../signup/index.html">Sign Up</a></li>
        <li><a href="../login/index.html">Login</a></li>
        <li><a href="../search/index.html">Search</a></li>
      `;
    }
  }

  // Initialize profile
  const urlUsername = window.location.pathname.split('/').pop();
  
  async function loadPrivateTestimonyLink() {
    if (!currentUser) return;

    try {
      const testimonySnapshot = await db.collection('testimonies')
        .where('authorUsername', '==', currentUser.username)
        .where('isPrivate', '==', true)
        .limit(1)
        .get();

      const privateLinkSection = document.getElementById('privateLinkSection');
      const privateLinkInput = document.getElementById('privateLink');
      
      if (!testimonySnapshot.empty) {
        const testimony = testimonySnapshot.docs[0].data();
        if (testimony.privateLink) {
          privateLinkInput.value = `${window.location.origin}/t/${testimony.privateLink}`;
          privateLinkSection.style.display = 'block';

          // Add copy functionality
          document.getElementById('copyPrivateLink').addEventListener('click', () => {
            privateLinkInput.select();
            document.execCommand('copy');
            
            // Show success message
            const button = document.getElementById('copyPrivateLink');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = '#28a745';
            
            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.background = '';
            }, 2000);
          });
        }
      } else {
        privateLinkSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading private testimony link:', error);
    }
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Get current user data
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        currentUser = { uid: user.uid, ...userDoc.data() };
        isOwnProfile = currentUser.username === urlUsername;
        
        // Get profile data for the URL username
        const profileQuery = await db.collection('users')
          .where('username', '==', urlUsername)
          .limit(1)
          .get();

        if (!profileQuery.empty) {
          const profileData = profileQuery.docs[0].data();
          updateProfile(profileData);
        } else {
          // Handle profile not found
          profileContent.innerHTML = '<p>Profile not found</p>';
        }
        
        updateNavLinks(currentUser);
        if (isOwnProfile) {
          await loadPrivateTestimonyLink();
        }
      }
    } else {
      // Handle not logged in state
      const profileQuery = await db.collection('users')
        .where('username', '==', urlUsername)
        .limit(1)
        .get();

      if (!profileQuery.empty) {
        const profileData = profileQuery.docs[0].data();
        updateProfile(profileData);
      } else {
        profileContent.innerHTML = '<p>Profile not found</p>';
      }
      updateNavLinks(null);
    }
  });
});
