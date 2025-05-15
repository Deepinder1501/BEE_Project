document.addEventListener('DOMContentLoaded', async () => {
  const editBtn = document.getElementById('edit-btn');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // 🟢 Step 1: Pre-fill user data using email from localStorage
  const userEmail = localStorage.getItem('user_email');

  if (!userEmail) {
    alert("User not logged in.");
    window.location.href = "/login";
    return;
  }

  try {
    const res = await fetch(`/get-profile?email=${encodeURIComponent(userEmail)}`);
    const user = await res.json();

    if (res.ok && user) {
      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
    } else {
      alert(user.message || 'Failed to load profile.');
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    alert('Error fetching profile data.');
  }

  // 🟡 Step 2: Handle Edit Profile Button
  editBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !email) {
      alert('Name and email are required.');
      return;
    }

    try {
      const res = await fetch('/edit-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Profile updated successfully!');
        passwordInput.value = '';
      } else {
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('An error occurred. Please try again.');
    }
  });
});
