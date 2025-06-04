document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('name');
  const passwordInput = document.getElementById('password');
  const usernameAvailability = document.getElementById('usernameAvailability');
  const emailAvailability = document.getElementById('emailAvailability');
  const nameInappropriate = document.getElementById('nameInappropriate');
  const passwordStrength = document.getElementById('passwordStrength');
  const signupForm = document.getElementById('signupForm');

  let bannedWords = [];

  // Load banned words from bannedlist.json
  async function loadBannedWords() {
    try {
      const response = await fetch('../bannedlist.json');
      const data = await response.json();
      bannedWords = data.bannedWords || [];
      console.log('Banned words loaded:', bannedWords);
    } catch (error) {
      console.error('Error loading banned words:', error);
      bannedWords = [];
    }
  }

  // Check for inappropriate words
  function isInappropriate(text) {
    if (!Array.isArray(bannedWords) || bannedWords.length === 0) {
      console.error('Banned words array is not properly initialized:', bannedWords);
      return false;
    }

    const lowerCaseText = text.toLowerCase();
    return bannedWords.some(word => lowerCaseText.includes(word.toLowerCase()));
  }

  // Check username availability and appropriateness
  usernameInput.addEventListener('input', async () => {
    const username = usernameInput.value.trim();
    const regex = /^[a-zA-Z0-9]{3,}$/;

    if (username) {
      if (!regex.test(username)) {
        usernameAvailability.textContent = 'Username must be at least 3 characters long and contain only letters and numbers';
        usernameAvailability.style.color = '#dc3545';
        return;
      }

      if (isInappropriate(username)) {
        usernameAvailability.textContent = 'Username contains inappropriate content';
        usernameAvailability.style.color = '#dc3545';
        return;
      }

      if (username.toLowerCase() === 'null') {
        usernameAvailability.textContent = 'This username is not allowed';
        usernameAvailability.style.color = '#dc3545';
        return;
      }

      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('username', '==', username).get();
      if (querySnapshot.empty) {
        usernameAvailability.textContent = 'Username is available';
        usernameAvailability.style.color = '#28a745';
      } else {
        usernameAvailability.textContent = 'Username is taken';
        usernameAvailability.style.color = '#dc3545';
      }
    } else {
      usernameAvailability.textContent = '';
    }
  });

  // Check name appropriateness
  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    if (name && isInappropriate(name)) {
      nameInappropriate.textContent = 'Name is inappropriate';
      nameInappropriate.style.color = '#dc3545';
    } else {
      nameInappropriate.textContent = '';
    }
  });

  // Password strength checker
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const lowercase = /[a-z]/.test(password);
    const uppercase = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const length = password.length >= 8;

    const lowercaseElement = document.getElementById('lowercase');
    const uppercaseElement = document.getElementById('uppercase');
    const numberElement = document.getElementById('number');
    const lengthElement = document.getElementById('length');

    lowercaseElement.classList.toggle('valid', lowercase);
    uppercaseElement.classList.toggle('valid', uppercase);
    numberElement.classList.toggle('valid', number);
    lengthElement.classList.toggle('valid', length);

    if (lowercase && uppercase && number && length) {
      passwordStrength.textContent = 'Password strength: Strong';
      passwordStrength.style.color = '#28a745';
    } else {
      passwordStrength.textContent = 'Password strength: Weak';
      passwordStrength.style.color = '#dc3545';
    }
  });

  // Sign up form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const nextStep = document.getElementById('nextStep').value;

    // Validate inputs
    if (isInappropriate(username) || isInappropriate(name)) {
      alert('Please choose appropriate username and name without offensive content.');
      return;
    }

    if (username.toLowerCase() === 'null') {
      alert('This username is not allowed.');
      return;
    }

    try {
      // Create user account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user document
      const userData = {
        username: username,
        email: email,
        name: name,
        bio: "",
        age: "",
        gender: "",
        denomination: "",
        socialMedia: "",
        socialMediaType: "",
        showAge: false,
        showGender: false,
        showDenomination: false,
        showEmail: false,
        privateProfile: false,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(user.uid).set(userData);

      // Create initial testimony document
      const testimonyData = {
        authorId: user.uid,
        authorUsername: username,
        authorName: name,
        title: "",
        testimony: "",
        tags: [],
        heartCount: 0,
        lastEdited: firebase.firestore.FieldValue.serverTimestamp(),
        isPublished: false
      };

      await db.collection('testimonies').add(testimonyData);

      // Redirect to profile page
      window.location.href = `/profile/${username}`;
    } catch (error) {
      console.error('Error during signup:', error);
      showError(error.message);
    }
  });

  // Load the banned words when the page loads
  loadBannedWords();
});

document.getElementById('branding').addEventListener('click', () => {
  window.location.href = '../index';
});

