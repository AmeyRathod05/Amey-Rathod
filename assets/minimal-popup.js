
document.addEventListener('DOMContentLoaded', function() {

  const popup = document.getElementById('minimal-product-popup');
  const popupImage = document.getElementById('popup-product-image');
  const popupTitle = document.getElementById('popup-product-title');
  const popupPrice = document.getElementById('popup-product-price');
  const popupDescription = document.getElementById('popup-product-description');
  const popupForm = document.getElementById('popup-add-to-cart-form');
  const variantSelectors = document.getElementById('popup-variant-selectors');
  const closeButton = popup.querySelector('.minimal-popup-close');
  
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
    popupPrice.textContent = formatMoney(product.price);
    
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
      updateVariants(product);
    }
  }
  
  function updateVariants(product) {
    variantSelectors.innerHTML = '';
    
    const options = {};
    
    product.options.forEach(option => {
      options[option.name] = {
        name: option.name,
        values: [...new Set(product.variants.map(v => v.option1))].filter(Boolean)
      };
    });
    
    Object.values(options).forEach(option => {
      if (option.name === 'Title' && option.values[0] === 'Default Title') {
        return;
      }
      
      const optionContainer = document.createElement('div');
      optionContainer.className = 'variant-option';
      optionContainer.innerHTML = `
        <h4>${option.name}</h4>
        <select class="variant-selector" data-option="${option.name}">
          ${option.values.map(value => 
            `<option value="${value}">${value}</option>`
          ).join('')}
        </select>
      `;
      
      variantSelectors.appendChild(optionContainer);
    });
    
    variantSelectors.querySelectorAll('.variant-selector').forEach(select => {
      select.addEventListener('change', updateSelectedVariant);
    });
    
    updateSelectedVariant();
  }
  
  function updateSelectedVariant() {
    if (!currentProduct || !currentProduct.variants) return;
    
    const selectedOptions = {};
    
    
    variantSelectors.querySelectorAll('.variant-selector').forEach(select => {
      const optionName = select.dataset.option;
      selectedOptions[optionName] = select.value;
    });
    
    const selectedVariant = currentProduct.variants.find(variant => {
      return Object.entries(selectedOptions).every(([key, value]) => {
        return variant[key.toLowerCase()] === value;
      });
    });
    
    if (selectedVariant) {
      popupPrice.textContent = formatMoney(selectedVariant.price);
      
      if (selectedVariant.featured_image) {
        popupImage.src = selectedVariant.featured_image.src.replace(/\.(jpg|jpeg|png|webp)/, 
          (match, ext) => `_600x.${ext}`);
      }
      
      const variantIdInput = document.getElementById('selected-variant-id');
      if (variantIdInput) {
        variantIdInput.value = selectedVariant.id;
      } else {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'id';
        input.id = 'selected-variant-id';
        input.value = selectedVariant.id;
        popupForm.appendChild(input);
      }
    }
  }
  
  function formatMoney(cents, format = '${{amount}}') {
    if (typeof cents === 'string') {
      cents = cents.replace(/\.\d+/, '');
    }
    
    const value = (cents / 100).toFixed(2);
    return format.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      switch (key) {
        case 'amount': return value;
        case 'amount_no_decimals': return Math.floor(cents / 100);
        case 'amount_with_comma_separator': return value.replace(/\./g, ',');
        case 'amount_no_decimals_with_comma_separator': return Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        default: return '';
      }
    });
  }
  
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
  
  if (popupForm) {
    popupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const variantId = document.getElementById('selected-variant-id')?.value;
      
      if (variantId) {
        console.log('Adding to cart:', variantId);
        
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', 1);
        
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          console.log('Added to cart:', data);
          hidePopup();
        })
        .catch(error => {
          console.error('Error adding to cart:', error);
        });
      }
    });
  }
});
