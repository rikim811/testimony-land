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
  const sendCodeButton = document.getElementById('sendCodeButton');
  const verificationCodeInput = document.getElementById('verificationCode');

  let bannedWords = [];
  let bannedEmails = [];

  // Load banned words from bannedlist.json
  async function loadBannedWords() {
    try {
      const response = await fetch('../bannedlist.json');
      const data = await response.json();
      bannedWords = data || [];
      console.log('Banned words loaded:', bannedWords);
    } catch (error) {
      console.error('Error loading banned words:', error);
      bannedWords = [];
    }
  }

  // Load banned emails from firestore
  async function loadBannedEmails() {
    try {
      const bannedEmailsRef = db.collection('bannedEmails');
      const querySnapshot = await bannedEmailsRef.get();
      querySnapshot.forEach(doc => {
        bannedEmails.push(doc.data().email);
      });
      console.log('Banned emails loaded:', bannedEmails);
    } catch (error) {
      console.error('Error loading banned emails:', error);
      bannedEmails = [];
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
      if (!regex.test(username) || isInappropriate(username) || username.toLowerCase() === 'null') {
        usernameAvailability.textContent = 'Username is inappropriate or invalid';
        usernameAvailability.style.color = 'red';
        return;
      }

      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('username', '==', username).get();
      if (querySnapshot.empty) {
        usernameAvailability.textContent = 'Username is available';
        usernameAvailability.style.color = 'green';
      } else {
        usernameAvailability.textContent = 'Username is taken';
        usernameAvailability.style.color = 'red';
      }
    } else {
      usernameAvailability.textContent = '';
    }
  });

  // Check email availability and appropriateness
  emailInput.addEventListener('input', async () => {
    const email = emailInput.value.trim();

    if (bannedEmails.includes(email)) {
      emailAvailability.textContent = 'Email is banned';
      emailAvailability.style.color = 'red';
      return;
    }

    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();
    if (querySnapshot.empty) {
      emailAvailability.textContent = 'Email is available';
      emailAvailability.style.color = 'green';
    } else {
      emailAvailability.textContent = 'Email is taken';
      emailAvailability.style.color = 'red';
    }
  });

  // Check name appropriateness
  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    if (name && isInappropriate(name)) {
      nameInappropriate.textContent = 'Name is inappropriate';
      nameInappropriate.style.color = 'red';
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

    document.getElementById('lowercase').style.color = lowercase ? 'green' : 'red';
    document.getElementById('uppercase').style.color = uppercase ? 'green' : 'red';
    document.getElementById('number').style.color = number ? 'green' : 'red';
    document.getElementById('length').style.color = length ? 'green' : 'red';

    if (lowercase && uppercase && number && length) {
      passwordStrength.textContent = 'Password strength: Strong';
      passwordStrength.style.color = 'green';
    } else {
      passwordStrength.textContent = 'Password strength: Weak';
      passwordStrength.style.color = 'red';
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
    const verificationCode = verificationCodeInput.value.trim();

    if (!verificationCode) {
      alert('Please enter the verification code sent to your email.');
      return;
    }

    if (isInappropriate(username) || username.toLowerCase() === 'null' || isInappropriate(name)) {
      alert('Please choose an appropriate username and name.');
      return;
    }

    if (bannedEmails.includes(email)) {
      alert('This email is banned. Please use a different email.');
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Verify email
      await user.sendEmailVerification();
      alert('A verification email has been sent to your email address. Please verify your email before proceeding.');

      // Monitor email verification
      auth.onAuthStateChanged(async (user) => {
        if (user && user.emailVerified) {
          await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            name: name,
            testimony: '',
            title: '',
            tags: [],
            lastEdited: firebase.firestore.FieldValue.serverTimestamp()
          });

          if (nextStep === 'profile') {
            window.location.href = `/profile/${username}?edit=true`;
          } else {
            window.location.href = `/testimony/${username}?edit=true`;
          }
        }
      });

    } catch (error) {
      console.error('Error signing up: ', error);
    }
  });

  // Resend verification email
  sendCodeButton.addEventListener('click', async () => {
    try {
      const user = auth.currentUser;
      console.log('Current user:', user); // Debugging: Check if user object is correctly retrieved
      if (user) {
        await user.sendEmailVerification();
        alert('Verification email resent. Please check your inbox.');
      } else {
        alert('No user is currently signed in.');
      }
    } catch (error) {
      console.error('Error resending verification email: ', error);
      alert('Failed to send verification email. Please try again later.');
    }
  });

  // Load the banned words and banned emails when the page loads
  loadBannedWords();
  loadBannedEmails();
});

document.getElementById('branding').addEventListener('click', () => {
  window.location.href = '../index';
});

