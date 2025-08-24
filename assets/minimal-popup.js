document.addEventListener('DOMContentLoaded', function() {

  const popup = document.getElementById('minimal-product-popup');
  const popupOverlay = document.querySelector('.minimal-popup-overlay');
  const closeButton = popup.querySelector('.minimal-popup-close');
  const popupContent = document.querySelector('.minimal-popup-content');
  const cartNotification = document.getElementById('cart-notification');
  const cartIcon = document.getElementById('cart-icon');
  const cartCount = document.querySelector('.cart-count');
  const popupImage = document.getElementById('popup-product-image');
  const popupTitle = document.getElementById('popup-product-title');
  const popupPrice = document.getElementById('popup-product-price');
  const popupDescription = document.getElementById('popup-product-description');
  const popupForm = document.getElementById('popup-add-to-cart-form');
  const variantSelectors = document.getElementById('popup-variant-selectors');
  
  let currentProduct = null;

  function showPopup() {
    popup.style.display = 'block';
    popup.style.visibility = 'hidden';
    
    void popup.offsetHeight;
    
    popup.style.visibility = 'visible';
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }
  
  function hidePopup() {
    popup.classList.remove('active');
    setTimeout(() => {
      popup.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  }
  
  closeButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    hidePopup();
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      e.preventDefault();
      hidePopup();
    }
  });
  
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      hidePopup();
    }
  });
  
  function loadProductData(handle) {
    popupImage.src = '';
    popupTitle.textContent = 'Loading...';
    popupPrice.textContent = '';
    popupDescription.textContent = '';
    variantSelectors.innerHTML = '';
    
    fetch(`/products/${handle}.js`)
      .then(response => response.json())
      .then(product => {
        currentProduct = product;
        updatePopupContent(product);
        showPopup();
      })
      .catch(error => {
        console.error('Error loading product:', error);
        popupTitle.textContent = 'Error loading product';
      });
  }
  
  function updatePopupContent(product) {
    popupTitle.textContent = product.title;
    popupPrice.textContent = `$${(product.price / 100).toFixed(2)}`;
    
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0].replace(/\.(jpg|jpeg|png|webp)/, 
        (match, ext) => `_600x.${ext}`);
      popupImage.src = imageUrl;
      popupImage.alt = product.title;
    }
    
    if (product.description) {
      popupDescription.innerHTML = product.description;
    }
    
    if (product.variants && product.variants.length > 0) {
      document.getElementById('selected-variant-id').value = product.variants[0].id;
    }
  }
  
  
  function updateCartCount() {
    cartIcon.style.display = 'flex';
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const itemCount = cart.item_count;
        cartCount.textContent = itemCount;
      });
  }
  
  function showNotification() {
    const productTitle = document.getElementById('popup-product-title').textContent;
    const notificationTitle = document.querySelector('.cart-notification .product-title');
    
    if (productTitle && notificationTitle) {
      const truncatedTitle = productTitle.length > 20 
        ? productTitle.substring(0, 20) + '...' 
        : productTitle;
      notificationTitle.textContent = truncatedTitle;
    }
    
    cartNotification.style.display = 'flex';
    cartNotification.style.opacity = '0';
    cartNotification.style.transform = 'translateX(20px)';
    
    
    setTimeout(() => {
      cartNotification.style.opacity = '1';
      cartNotification.style.transform = 'translateX(0)';
      
      
      setTimeout(() => {
        cartNotification.style.opacity = '0';
        cartNotification.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
          cartNotification.style.display = 'none';
        }, 300);
      }, 3000);
    }, 10);
    
    updateCartCount();
  }
  
  if (popupForm) {
    popupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const variantId = document.getElementById('selected-variant-id').value;
      if (!variantId) return;
      
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              id: variantId,
              quantity: 1
            }]
          })
        });
        
        if (response.ok) {
          showNotification();
          hidePopup();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }
  
  if (cartIcon) {
    cartIcon.addEventListener('click', function() {
      window.location.href = '/cart';
    });
  }
  
  updateCartCount();
  
  document.addEventListener('click', function(e) {
    const quickViewBtn = e.target.closest('.quick-view') || e.target.closest('.quick-view-icon');
    if (!quickViewBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const productHandle = quickViewBtn.dataset.productHandle;
    if (productHandle) {
      loadProductData(productHandle);
    }
  });
});
