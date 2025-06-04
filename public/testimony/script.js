let bannedWords = [];

// Fetch the banned words from the server
async function fetchBannedWords() {
  try {
    const response = await fetch('../bannedlist.json'); // Load banned words
    bannedWords = await response.json();
    console.log('Banned words loaded:', bannedWords);
  } catch (error) {
    console.error('Error loading banned words:', error);
  }
}

// Check if the input contains any banned words
function containsBannedWords(input) {
  const lowerCaseInput = input.toLowerCase();
  return bannedWords.some(word => lowerCaseInput.includes(word));
}

// Validate the form before submission
function validateForm(input) {
  if (containsBannedWords(input)) {
    alert('Your input contains banned words. Please remove them and try again.');
    return false;
  }
  return true;
}

// Update tag display
function updateFormTags() {
  const tagsInput = document.getElementById('tagInput');
  const tagsContainer = document.getElementById('tags');
  const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3);

  tagsContainer.innerHTML = '';
  tags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    const removeSpan = document.createElement('span');
    removeSpan.textContent = '×';
    removeSpan.addEventListener('click', () => {
      tagsInput.value = tags.filter(t => t !== tag).join(', ');
      updateFormTags();
    });
    tagElement.appendChild(removeSpan);
    tagsContainer.appendChild(tagElement);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchBannedWords();

  function getUsernameFromPath() {
    const path = window.location.pathname.split('/');
    return path[path.length - 1];
  }

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
            <li><a href="/search/index.html" class="whiteButton">Search</a></li>
            <li><a href="#" id="logoutButton" class="whiteButton">Logout</a></li>
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
        <li><a href="/search/index.html" class="whiteButton">Search</a></li>
        <li><a href="/signup/index.html" class="whiteButton">Sign Up</a></li>
        <li><a href="/login/index.html" class="whiteButton">Login</a></li>
      `;
    }
  }

  function displayTags(tags) {
    const tagsContainer = document.getElementById('testimonyTags');
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.classList.add('tag');
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    });
  }

  function fetchUserProfile(username) {
    const usersRef = db.collection('users');
    usersRef.where('username', '==', username).get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const testimonyId = userDoc.id;

          document.getElementById('testimonyTitle').textContent = userData.title || 'Not available yet';
          document.getElementById('testimonyText').textContent = userData.testimony || 'Not available yet';
          document.getElementById('testimonyAuthor').innerHTML = `By: <a href="/profile/${userData.username}">${userData.username}</a>`;
          displayTags(userData.tags || []);

          if (userData.lastEdited) {
            const lastEditedDate = new Date(userData.lastEdited.seconds * 1000);
            document.getElementById('lastEdited').textContent = `Last edited on: ${lastEditedDate.toLocaleString()}`;
          }

          if (auth.currentUser && auth.currentUser.uid === userDoc.id) {
            document.getElementById('editButton').classList.remove('hidden');
            document.getElementById('editButton').addEventListener('click', () => {
              document.getElementById('testimonyText').classList.add('hidden');
              document.getElementById('testimonyBox').classList.add('hidden');
              document.getElementById('editTestimony').classList.remove('hidden');
              document.getElementById('editTestimony').value = userData.testimony || '';
              document.getElementById('editTitle').classList.remove('hidden');
              document.getElementById('editTitle').value = userData.title || '';
              document.getElementById('tagContainer').classList.remove('hidden');
              document.getElementById('tagInput').value = userData.tags ? userData.tags.join(', ') : '';
              updateFormTags();
              document.getElementById('saveButton').classList.remove('hidden');
              document.getElementById('cancelButton').classList.remove('hidden');
            });

            document.getElementById('saveButton').addEventListener('click', async () => {
              const newTestimony = document.getElementById('editTestimony').value;
              const newTitle = document.getElementById('editTitle').value;
              const newTags = document.getElementById('tagInput').value.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3);
              if (validateForm(newTestimony) && validateForm(newTitle) && newTags.every(tag => validateForm(tag))) {
                await db.collection('users').doc(auth.currentUser.uid).update({
                  testimony: newTestimony,
                  title: newTitle,
                  tags: newTags,
                  lastEdited: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('testimonyText').textContent = newTestimony || 'Not available yet';
                document.getElementById('testimonyTitle').textContent = newTitle || 'Not available yet';
                displayTags(newTags);
                document.getElementById('testimonyText').classList.remove('hidden');
                document.getElementById('testimonyBox').classList.remove('hidden');
                document.getElementById('editTestimony').classList.add('hidden');
                document.getElementById('editTitle').classList.add('hidden');
                document.getElementById('tagContainer').classList.add('hidden');
                document.getElementById('saveButton').classList.add('hidden');
                document.getElementById('cancelButton').classList.add('hidden');
              }
            });

            document.getElementById('cancelButton').addEventListener('click', () => {
              document.getElementById('testimonyText').classList.remove('hidden');
              document.getElementById('testimonyBox').classList.remove('hidden');
              document.getElementById('editTestimony').classList.add('hidden');
              document.getElementById('editTitle').classList.add('hidden');
              document.getElementById('tagContainer').classList.add('hidden');
              document.getElementById('saveButton').classList.add('hidden');
              document.getElementById('cancelButton').classList.add('hidden');
            });
          } else {
            document.getElementById('editButton').classList.add('hidden');
            document.getElementById('saveButton').classList.add('hidden');
            document.getElementById('cancelButton').classList.add('hidden');
          }

          displayComments(testimonyId);

          document.getElementById('postComment').addEventListener('click', async () => {
            const newComment = document.getElementById('newComment').value;
            if (newComment.trim() !== '') {
              if (validateForm(newComment)) {
                const commentAuthor = auth.currentUser ? userData.username : 'Anonymous';
                await db.collection('comments').add({
                  testimonyId: testimonyId,
                  author: commentAuthor,
                  text: newComment,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('newComment').value = '';
              }
            }
          });
        } else {
          document.getElementById('testimonyText').textContent = 'No testimony found for this user.';
          console.log("No testimony found for this user.");
        }
      })
      .catch((error) => {
        console.error('Error fetching testimony:', error);
      });
  }

  auth.onAuthStateChanged((user) => {
    updateNavLinks(user);

    const username = getUsernameFromPath();

    if (username) {
      fetchUserProfile(username);
    } else {
      document.getElementById('testimonyText').textContent = 'No username specified.';
    }
  });

  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      window.location.href = '/search/index.html';
    });
  }
});

function displayComments(testimonyId) {
  const commentList = document.getElementById('commentList');
  db.collection('comments').where('testimonyId', '==', testimonyId)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      commentList.innerHTML = '';
      snapshot.forEach((doc) => {
        const comment = doc.data();
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.innerHTML = `
          <div class="comment-author"><a href="/profile/${comment.author}">${comment.author}</a></div>
          <div class="comment-text">${comment.text}</div>
        `;
        commentList.appendChild(commentDiv);
      });
    });
}

document.getElementById('tagInput').addEventListener('input', updateFormTags);

document.getElementById('branding').addEventListener('click', () => {
  window.location.href = '../index';
});