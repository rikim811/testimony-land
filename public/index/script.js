document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('navLinks');
    const joinButton = document.getElementById('joinButton');
    const featureCards = document.querySelectorAll('.feature-card');
  
    // Add intersection observer for feature cards
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    // Initialize feature cards with opacity 0 and observe them
    featureCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      observer.observe(card);
    });

    auth.onAuthStateChanged((user) => {
      if (user) {
        updateNavLinks(user);
      } else {
        displayGuestLinks();
      }
    });
  
    function updateNavLinks(user) {
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
    }
  
    function displayGuestLinks() {
      navLinks.innerHTML = `
        <li><a href="../signup/index.html">Sign Up</a></li>
        <li><a href="../login/index.html">Login</a></li>
        <li><a href="../search/index.html">Search</a></li>
      `;
    }
  
    joinButton.addEventListener('click', () => {
      window.location.href = '../signup/index.html';
    });
});
  