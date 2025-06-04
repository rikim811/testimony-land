let bannedWords = [];
let testimonyDoc = null;
let currentUser = null;

// DOM Elements (declare these at the top level)
let profileAvatar;
let profileName;
let testimonyTitle;
let testimonyText;
let lastEdited;
let actionButtons;
let testimonyTags;

// Helper Functions
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Update testimony function (move outside DOMContentLoaded)
function updateTestimony(testimonyData, currentUser) {
  // Update page title and content
  document.title = `${testimonyData.title} - Testimony Land`;
  testimonyTitle.textContent = testimonyData.title;
  
  // Update testimony content with HTML formatting
  testimonyText.innerHTML = testimonyData.testimony || '';
  
  // Update author info
  profileAvatar.textContent = getInitials(testimonyData.authorName);
  profileName.textContent = testimonyData.authorName;
  profileName.href = `/profile/${testimonyData.authorUsername}`;

  // Update last edited date
  if (testimonyData.lastEdited) {
    lastEdited.textContent = `Last edited ${formatDate(testimonyData.lastEdited.toDate())}`;
  }

  // Update tags
  testimonyTags.innerHTML = '';
  if (testimonyData.tags && testimonyData.tags.length > 0) {
    testimonyData.tags.slice(0, 3).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      testimonyTags.appendChild(tagElement);
    });
  }

  // Check if current user is the author
  const isAuthor = currentUser?.username === testimonyData.authorUsername;

  // Update action buttons
  actionButtons.innerHTML = '';
  
  if (isAuthor) {
    // Show edit button for author
    actionButtons.innerHTML = `
      <button class="action-button edit-button" id="editButton">
        <i class="fas fa-edit"></i> Edit Testimony
      </button>
    `;
    document.getElementById('editButton').addEventListener('click', () => {
      window.location.href = `/testimony/edit/${testimonyData.authorUsername}`;
    });
  } else if (currentUser) {
    // Show heart button for logged-in non-authors
    actionButtons.innerHTML = `
      <button class="action-button heart-button" id="heartButton">
        <i class="fas fa-heart"></i> Heart (${testimonyData.heartCount || 0})
      </button>
    `;
    document.getElementById('heartButton').addEventListener('click', handleHeart);
    updateHeartButton();
  }
}

// Initialize DOM elements when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize DOM elements
  profileAvatar = document.getElementById('authorAvatar');
  profileName = document.getElementById('authorName');
  testimonyTitle = document.getElementById('testimonyTitle');
  testimonyText = document.getElementById('testimonyText');
  lastEdited = document.getElementById('lastEdited');
  actionButtons = document.getElementById('actionButtons');
  testimonyTags = document.getElementById('testimonyTags');

  // ... rest of your DOMContentLoaded code ...
});

// Fetch the banned words from the server
async function fetchBannedWords() {
  try {
    const response = await fetch('../../bannedlist.json'); // Adjust the path as needed
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

// Testimony Management Functions
async function loadTestimony() {
  const username = window.location.pathname.split('/').pop(); // Extract username from the URL
  console.log('Fetching testimony for:', username); // Log the username

  try {
    const testimonySnapshot = await db.collection('testimonies')
      .where('authorUsername', '==', username)
      .get();

    console.log('Testimony snapshot:', testimonySnapshot); // Log the snapshot

    if (testimonySnapshot.empty) {
      console.log('No testimony found for this user.');
      testimonyText.textContent = 'No testimony available.';
      return;
    }

    testimonySnapshot.forEach(doc => {
      const testimonyData = doc.data();
      console.log('Testimony data:', testimonyData); // Log the testimony data
      testimonyText.innerHTML = testimonyData.testimony; // Use innerHTML to render HTML content
      console.log('Testimony displayed:', testimonyText.innerHTML); // Log the displayed testimony
    });
  } catch (error) {
    console.error('Error loading testimony:', error);
    testimonyText.textContent = 'Error loading testimony.';
  }
}

function displayTestimony(testimony) {
  elements.title.textContent = testimony.title || '';
  elements.text.textContent = testimony.text || '';
  elements.author.textContent = `Posted by: ${testimony.author || 'Anonymous'}`;
  
  if (elements.editTextarea) {
    elements.editTextarea.value = testimony.text || '';
  }
}

// Comment Management Functions
function displayComments(testimonyId) {
  db.collection('comments')
    .where('testimonyId', '==', testimonyId)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      elements.commentList.innerHTML = '';
      snapshot.forEach((doc) => {
        const comment = doc.data();
        appendCommentToDOM(comment);
      });
    });
}

function appendCommentToDOM(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.classList.add('comment');
  commentDiv.innerHTML = `
    <div class="comment-author">
      <a href="/profile/${comment.author}">${comment.author}</a>
    </div>
    <div class="comment-text">${comment.text}</div>
  `;
  elements.commentList.appendChild(commentDiv);
}

async function postComment(testimonyId) {
  const commentText = elements.newComment.value.trim();
  if (!commentText) return;

  try {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    await db.collection('comments').add({
      testimonyId,
      author: user.displayName || user.email,
      text: commentText,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    elements.newComment.value = '';
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Failed to post comment');
  }
}

// Tag Management Functions
function updateFormTags() {
  const tags = elements.tagInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  
  displayTags(tags);
}

function displayTags(tags) {
  elements.tagList.innerHTML = '';
  tags.forEach(tag => {
    const tagElement = document.createElement('div');
    tagElement.classList.add('tag');
    tagElement.innerHTML = `
      ${tag}
      <span onclick="removeTag('${tag}')">&times;</span>
    `;
    elements.tagList.appendChild(tagElement);
  });
}

// UI Helper Functions
function setupUserInterface(user) {
  // Show edit controls if user is the author
  const isAuthor = testimony.authorId === user.uid;
  elements.editControls.style.display = isAuthor ? 'block' : 'none';
}

function showError(message) {
  // Implement error display logic
  console.error(message);
  alert(message);
}

// Add this function to handle hearts
async function handleHeart() {
  if (!currentUser || !testimonyDoc) {
    alert('Please log in to heart this testimony');
    return;
  }

  try {
    const heartRef = db.collection('hearts').doc(`${testimonyDoc.id}_${currentUser.uid}`);
    const heartDoc = await heartRef.get();

    if (heartDoc.exists) {
      // Remove heart
      await heartRef.delete();
      await testimonyDoc.ref.update({
        heartCount: firebase.firestore.FieldValue.increment(-1)
      });
    } else {
      // Add heart
      await heartRef.set({
        testimonyId: testimonyDoc.id,
        userId: currentUser.uid,
        authorUsername: testimonyDoc.data().authorUsername,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await testimonyDoc.ref.update({
        heartCount: firebase.firestore.FieldValue.increment(1)
      });
    }

    // Update heart button state
    updateHeartButton();
  } catch (error) {
    console.error('Error handling heart:', error);
    alert('Failed to update heart');
  }
}

// Add this function to check and update heart button state
async function updateHeartButton() {
  const heartButton = document.getElementById('heartButton');
  if (!heartButton || !currentUser || !testimonyDoc) return;

  try {
    const heartRef = await db.collection('hearts')
      .doc(`${testimonyDoc.id}_${currentUser.uid}`)
      .get();

    heartButton.innerHTML = `
      <i class="fas fa-heart${heartRef.exists ? ' text-danger' : ''}"></i>
      Heart${heartRef.exists ? 'ed' : ''} (${testimonyDoc.data().heartCount || 0})
    `;
    heartButton.classList.toggle('hearted', heartRef.exists);
  } catch (error) {
    console.error('Error updating heart button:', error);
  }
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('User is authenticated:', user); // Log user info
    await loadTestimony(); // Call loadTestimony only if the user is authenticated
  } else {
    console.log('User is not authenticated');
    window.location.href = '../login/index.html'; // Redirect to login if not authenticated
  }
});