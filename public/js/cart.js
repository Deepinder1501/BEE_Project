document.addEventListener("DOMContentLoaded", () => {
    const cartContent = document.getElementById("cart-content");
    const cartTotal = document.getElementById("cart-total");
  
    function loadCart() {
      fetch("/cart-items")
        .then((res) => {
          if (res.status === 401) {
            alert("Please log in to access your cart.");
            window.location.href = "/login";
            throw new Error("Unauthorized access to cart.");
          }
          return res.json();
        })
        .then((items) => {
          cartContent.innerHTML = "";
          let total = 0;
  
          items.forEach((item) => {
            total += item.price * item.quantity;
  
            cartContent.innerHTML += `
              <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
                <div class="cart-item-details">
                  <h4>${item.name}</h4>
                  <p>$${item.price} x <span class="quantity">${item.quantity}</span></p>
                  <div class="cart-item-controls">
                    <button class="btn decrease-qty">-</button>
                    <span class="qty">${item.quantity}</span>
                    <button class="btn increase-qty">+</button>
                    <button class="btn remove-item">Remove</button>
                  </div>
                </div>
              </div>
            `;
          });
  
          cartTotal.textContent = `$${total.toFixed(2)}`;
          attachEventListeners();
        })
        .catch((err) => console.error("Error loading cart:", err));
    }
  
    function attachEventListeners() {
      document.querySelectorAll(".increase-qty").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".cart-item").dataset.id;
          updateItem(id, "increase");
        });
      });
  
      document.querySelectorAll(".decrease-qty").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".cart-item").dataset.id;
          updateItem(id, "decrease");
        });
      });
  
      document.querySelectorAll(".remove-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".cart-item").dataset.id;
          removeItem(id);
        });
      });
    }
  
    function updateItem(id, action) {
      fetch("/update-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
        .then((res) => {
          if (res.status === 401) {
            alert("Please log in to update cart items.");
            window.location.href = "/login";
            throw new Error("Unauthorized cart update.");
          }
          return res.json();
        })
        .then(() => loadCart())
        .catch((err) => console.error("Error updating cart:", err));
    }
  
    function removeItem(id) {
      fetch("/remove-from-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
        .then((res) => {
          if (res.status === 401) {
            alert("Please log in to remove items from your cart.");
            window.location.href = "/login";
            throw new Error("Unauthorized item removal.");
          }
          return res.json();
        })
        .then(() => loadCart())
        .catch((err) => console.error("Error removing item:", err));
    }
  
    loadCart();
  });
  