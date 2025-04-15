document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const usersBtn = document.getElementById('usersBtn');
    const productsBtn = document.getElementById('productsBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const addProductForm = document.getElementById('addProductForm');
  
    // Section toggle
    usersBtn.addEventListener('click', () => showSection('users'));
    productsBtn.addEventListener('click', () => showSection('products'));
  
    // Modal controls
    addProductBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
  
    // Add product
    addProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(addProductForm);
      const product = Object.fromEntries(formData);
  
      fetch('/admin/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      }).then(() => {
        closeModal();
        loadProducts();
        addProductForm.reset();
      });
    });
  
    // User delete
    document.getElementById('users-table').addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-user')) {
        const email = e.target.dataset.email;
        deleteUser(email);
      }
    });
  
    // Product delete listener
    document.getElementById('products-table').addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-product')) {
        const name = e.target.dataset.name;
        deleteProduct(name);
      }
    });
  
    // Product edit listener
    document.getElementById('products-table').addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      const index = Array.from(row.parentNode.children).indexOf(row);
  
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const field = e.target.closest('td').cellIndex === 0
          ? 'name' : e.target.closest('td').cellIndex === 1
          ? 'price' : 'description';
        const value = e.target.value;
  
        editProduct(index, field, value);
      }
    });
  
    // Load initial section
    showSection('users');
  });
  
  // Show users/products section
  function showSection(section) {
    const usersSection = document.getElementById('users-section');
    const productsSection = document.getElementById('products-section');
  
    if (section === 'users') {
      usersSection.style.display = 'block';
      productsSection.style.display = 'none';
      loadUsers();
    } else {
      usersSection.style.display = 'none';
      productsSection.style.display = 'block';
      loadProducts();
    }
  }
  
  // Open/close modal
  function openModal() {
    document.getElementById('productModal').style.display = 'block';
  }
  
  function closeModal() {
    document.getElementById('productModal').style.display = 'none';
  }
  
  // Load users
  function loadUsers() {
    fetch('/admin/users')
      .then(res => res.json())
      .then(data => {
        const table = document.getElementById('users-table');
        table.innerHTML = '';
        data.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><button class="delete-user" data-email="${user.email}">Delete</button></td>
          `;
          table.appendChild(row);
        });
      });
  }
  
  // Delete user
  function deleteUser(email) {
    if (confirm('Are you sure you want to delete this user?')) {
      fetch('/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json(); // Ensure the server responds with valid JSON
      })
      .then(data => {
        if (data.success) {
          alert('User deleted successfully');
          loadUsers();
        } else {
          alert('Failed to delete user');
        }
      })
      .catch(err => {
        console.error('Error deleting user:', err);
        alert('An error occurred. Please try again.');
      });
    }
  }
  
  // Load products
  function loadProducts() {
    fetch('/admin/products')
      .then(res => res.json())
      .then(data => {
        const table = document.getElementById('products-table');
        table.innerHTML = '';
        data.forEach((product) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><input value="${product.name}" /></td>
            <td><input type="number" value="${product.price}" /></td>
            <td><textarea>${product.description}</textarea></td>
            <td><button class="delete-product" data-name="${product.name}">Delete</button></td>
          `;
          table.appendChild(row);
        });
      });
  }
  
  // Edit product
  function editProduct(index, field, value) {
    fetch('/admin/products/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, field, value })
    });
  }
  
  function deleteProduct(productName) {
    if (confirm('Are you sure you want to delete this product?')) {
      fetch('/admin/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json(); // Ensure the server responds with valid JSON
      })
      .then(data => {
        if (data.success) {
          alert('Product deleted successfully');
          loadProducts();
        } else {
          alert('Failed to delete product');
        }
      })
      .catch(err => {
        console.error('Error deleting product:', err);
        alert('An error occurred. Please try again.');
      });
    }
  }