document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('editForm');
  const titleInput = document.getElementById('title');
  const testimonyInput = document.getElementById('testimony');
  const tagsInput = document.getElementById('tags');
  const tagsList = document.getElementById('tagsList');
  const cancelButton = document.getElementById('cancelButton');
  const publishCheckbox = document.getElementById('publishTestimony');

  let currentUser = null;
  let testimonyDoc = null;
  let quill = null;

  function updateNavLinks(user) {
    const navLinks = document.getElementById('navLinks');
    if (user) {
      navLinks.innerHTML = `
        <li><a href="../../testimony/${user.username}">Testimony</a></li>
        <li><a href="../../profile/${user.username}">Profile</a></li>
        <li><a href="../../search/index.html">Search</a></li>
        <li><a href="#" id="logoutButton">Logout</a></li>
      `;
      document.getElementById('logoutButton').addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = '../../login/index.html';
        });
      });
    } else {
      window.location.href = '../../login/index.html';
    }
  }

  function updateTagsList() {
    // Get all tags, including ones being typed
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag); // Keep all non-empty tags while typing

    // Display all tags (limit to 3 only when displaying)
    tagsList.innerHTML = '';
    tags.slice(0, 3).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagsList.appendChild(tagElement);
    });
    
    // Don't modify the input value while typing
    // Only limit tags when saving
  }

  // Initialize Quill
  quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['clean']
      ]
    },
    placeholder: 'Share your testimony...'
  });

  // Load testimony data
  async function loadTestimony() {
    const username = window.location.pathname.split('/').pop();
    const testimonySnapshot = await db.collection('testimonies')
      .where('authorUsername', '==', username)
      .limit(1)
      .get();

    if (!testimonySnapshot.empty) {
      testimonyDoc = testimonySnapshot.docs[0];
      const data = testimonyDoc.data();
      
      titleInput.value = data.title || '';
      
      // Set the content in Quill editor
      if (data.testimony) {
        quill.setContents(quill.clipboard.convert(data.testimony));
      }
      
      tagsInput.value = (data.tags || []).join(', ');
      publishCheckbox.checked = data.isPublished || false;
      document.getElementById('privateTestimony').checked = data.isPrivate || false;
      updateTagsList();
    }
  }

  // Handle form submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!testimonyDoc) return;

    const isPrivate = document.getElementById('privateTestimony').checked;
    const privateLink = isPrivate ? generatePrivateLink() : null;

    // Get the HTML content from Quill
    const testimonyContent = quill.root.innerHTML.trim();
    
    // Clean up empty paragraphs and unnecessary tags
    const cleanContent = testimonyContent
      .replace(/<p><br><\/p>/g, '') // Remove empty paragraphs
      .replace(/^<p>|<\/p>$/g, ''); // Remove wrapping paragraph tags if they're empty

    const updates = {
      title: titleInput.value.trim(),
      testimony: cleanContent,
      tags: tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .slice(0, 3),
      lastEdited: firebase.firestore.FieldValue.serverTimestamp(),
      isPublished: publishCheckbox.checked,
      isPrivate: isPrivate,
      privateLink: privateLink
    };

    try {
      await testimonyDoc.ref.update(updates);
      if (isPrivate) {
        window.location.href = `/t/${privateLink}`;
      } else {
        window.location.href = `/testimony/${currentUser.username}`;
      }
    } catch (error) {
      console.error('Error updating testimony:', error);
      alert('Failed to update testimony. Please try again.');
    }
  });

  // Handle cancel button
  cancelButton.addEventListener('click', () => {
    window.location.href = `../../testimony/${currentUser.username}`;
  });

  // Handle tags input with debounce
  let tagInputTimeout;
  tagsInput.addEventListener('input', () => {
    clearTimeout(tagInputTimeout);
    tagInputTimeout = setTimeout(updateTagsList, 300); // Update preview after typing stops
  });

  // Add comma key handling
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === ',') {
      const currentTags = tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      if (currentTags.length >= 3) {
        e.preventDefault(); // Prevent adding more than 3 tags
        alert('Maximum 3 tags allowed');
      }
    }
  });

  // Initialize page
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        currentUser = { uid: user.uid, ...userDoc.data() };
        updateNavLinks(currentUser);
        await loadTestimony();
      }
    } else {
      updateNavLinks(null);
    }
  });

  // Add click handler for logo
  document.getElementById('branding').addEventListener('click', () => {
    window.location.href = '../../index';
  });

  function generatePrivateLink() {
    return 'p_' + Math.random().toString(36).substring(2, 15);
  }
}); 