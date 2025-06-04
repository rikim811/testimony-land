document.addEventListener('DOMContentLoaded', () => {
  const userId = 'tkSubesXb8XYvdaKW2JmU8iwWUI3'; // Moderator user ID
  const userList = document.getElementById('userList');
  const searchResults = document.getElementById('searchResults');

  auth.onAuthStateChanged((user) => {
    if (user && user.uid === userId) {
      // loadUserData(); // Only call when needed
    } else {
      alert('Access denied');
      window.location.href = '../index.html';
    }
  });

  document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchQuery').value.trim().toLowerCase();
    const searchType = document.getElementById('searchType').value;
    if (query) {
      searchResults.innerHTML = 'Searching...';
      if (searchType === 'testimony') {
        searchTestimonies(query);
      } else if (searchType === 'comments') {
        searchComments(query);
      } else {
        searchUsersByField(searchType, query);
      }
    }
  });

  document.getElementById('showAllButton').addEventListener('click', () => {
    const searchType = document.getElementById('searchType').value;
    searchResults.innerHTML = 'Loading all...';
    loadAllUsers(searchType);
  });

  async function searchUsersByField(field, query) {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.get();
      const results = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tags = data.tags ? data.tags.map(tag => tag.toLowerCase()) : [];

        console.log('Checking user:', data.username, 'Tags:', tags); // Debugging log

        if (field === 'tags' && tags.includes(query.toLowerCase())) {
          results.push(data);
        } else if (data[field] && data[field].toLowerCase().includes(query.toLowerCase())) {
          results.push(data);
        }
      });

      displaySearchResults(results);
    } catch (error) {
      console.error(`Error searching users by ${field}:`, error);
      searchResults.innerHTML = `Error searching users by ${field}. Please try again.`;
    }
  }

  async function searchTestimonies(query) {
    try {
      const testimoniesRef = db.collection('testimonies');
      const querySnapshot = await testimoniesRef.where('words', 'array-contains', query).get();
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });
      displaySearchResults(results);
    } catch (error) {
      console.error('Error searching testimonies:', error);
      searchResults.innerHTML = 'Error searching testimonies. Please try again.';
    }
  }

  async function searchComments(query) {
    try {
      const commentsRef = db.collection('comments');
      const querySnapshot = await commentsRef.where('words', 'array-contains', query).get();
      const results = [];
      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });
      displaySearchResults(results);
    } catch (error) {
      console.error('Error searching comments:', error);
      searchResults.innerHTML = 'Error searching comments. Please try again.';
    }
  }

  async function loadAllUsers(field) {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.get();
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (field === 'tags' && Array.isArray(data[field])) {
          results.push(data);
        } else if (data[field]) {
          results.push(data);
        }
      });
      displaySearchResults(results);
    } catch (error) {
      console.error(`Error loading all users by ${field}:`, error);
      searchResults.innerHTML = `Error loading all users by ${field}. Please try again.`;
    }
  }

  function displaySearchResults(results) {
    if (results.length > 0) {
      searchResults.innerHTML = '';
      results.forEach((data) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('resultItem');
        resultItem.innerHTML = `
          <p><strong>Username:</strong> ${data.username}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Social Media:</strong> ${data.socialMedia}</p>
          <p><strong>Tags:</strong> ${data.tags ? data.tags.join(', ') : ''}</p>
          <button onclick="deleteUser('${data.id}')">Delete/Ban User</button>
          <button onclick="viewProfile('${data.username}')">View Profile</button>
          <button onclick="viewTestimony('${data.username}')">View Testimony</button>
        `;
        searchResults.appendChild(resultItem);
      });
    } else {
      searchResults.innerHTML = 'No results found.';
    }
  }

  async function deleteUser(userId) {
    try {
      await db.collection('users').doc(userId).delete();
      alert('User banned/deleted successfully!');
      loadUserData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  }

  function viewProfile(username) {
    window.location.href = `/profile/${username}`;
  }

  function viewTestimony(username) {
    window.location.href = `/testimony/${username}`;
  }
});
