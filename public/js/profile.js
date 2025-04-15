document.addEventListener('DOMContentLoaded', async () => {
    const editBtn = document.getElementById('edit-btn');
  
    // 🟡 Step 1: Handle Edit Profile Button
    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();
  
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
  
      const name = nameInput.value;
      const email = emailInput.value;
      const password = passwordInput.value;
  
      if (!name || !email) {
        alert('Name and email are required.');
        return;
      }
  
      try {
        const res = await fetch('/edit-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          alert(data.message || 'Profile updated successfully!');
          passwordInput.value = ''; // Clear the password field
        } else {
          alert(data.message || 'Failed to update profile.');
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        alert('An error occurred. Please try again.');
      }
    });
  
    // 🟢 Step 2: Get Email from LocalStorage
    });
  