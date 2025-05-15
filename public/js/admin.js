document.addEventListener('DOMContentLoaded', () => {
  const usersBtn = document.getElementById('usersBtn');
  const productsBtn = document.getElementById('productsBtn');
  const addProductBtn = document.getElementById('addProductBtn');
  const closeModalBtn = document.getElementById('closeModal');
  const addProductForm = document.getElementById('addProductForm');

  usersBtn.addEventListener('click', () => showSection('users'));
  productsBtn.addEventListener('click', () => showSection('products'));

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

  // Delete user
  document.getElementById('users-table').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-user')) {
      const id = e.target.dataset.id;
      deleteUser(id);
    }
  });

  // Delete product
  document.getElementById('products-table').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-product')) {
      const id = e.target.dataset.id;
      deleteProduct(id);
    }
  });

  // Edit product
  document.getElementById('products-table').addEventListener('input', (e) => {
    const row = e.target.closest('tr');
    const id = row.dataset.id;

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      const field = e.target.closest('td').cellIndex === 0
        ? 'name' : e.target.closest('td').cellIndex === 1
        ? 'price' : 'description';
      const value = e.target.value;

      editProduct(id, field, value);
    }
  });

  showSection('users');
});

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

// Modal controls
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
          <td><button class="delete-user" data-id="${user._id}">Delete</button></td>
        `;
        table.appendChild(row);
      });
    });
}

// Delete user
function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    fetch('/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    .then(res => res.json())
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
      data.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.id = product._id;
        row.innerHTML = `
          <td><input value="${product.name}" /></td>
          <td><input type="number" value="${product.price}" /></td>
          <td><textarea>${product.description}</textarea></td>
          <td><button class="delete-product" data-id="${product._id}">Delete</button></td>
        `;
        table.appendChild(row);
      });
    });
}

// Edit product
function editProduct(id, field, value) {
  fetch('/admin/products/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, field, value })
  });
}

// Delete product
function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    fetch('/admin/products/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    .then(res => res.json())
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
