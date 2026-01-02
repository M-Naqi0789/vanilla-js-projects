



 let products = [];
        let cart = [];

        const elements = {
            productList: document.getElementById('product-list'),
            cartCount: document.getElementById('cart-count'),
            cartToggle: document.getElementById('cart-toggle'),
            cartModal: document.getElementById('cart-modal'),
            cartContent: document.getElementById('cart-content'),
            cartItems: document.getElementById('cart-items'),
            emptyCartMessage: document.getElementById('empty-cart-message'),
            totalAmount: document.getElementById('total-amount'),
            checkoutBtn: document.getElementById('checkout-btn'),
            messageModal: document.getElementById('message-modal'),
            messageText: document.getElementById('message-text'),
            categorySelect: document.getElementById('category-select'),
            searchInput: document.getElementById('search-input'),
        };

        function showMessage(text) {
            elements.messageText.textContent = text;
            elements.messageModal.style.display = 'flex';
        }

        function closeMessageModal() {
            elements.messageModal.style.display = 'none';
        }

        function loadCart() {
            const savedCart = localStorage.getItem('shoppingCart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
            }
            updateCartUI();
        }

        function saveCart() {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
            updateCartUI();
        }

        async function fetchProducts() {
            elements.productList.innerHTML = `<div class="col-span-full text-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div><p class="text-gray-500 mt-3">Loading products...</p></div>`;
            try {
                const response = await fetch('https://fakestoreapi.com/products');
                products = await response.json();
                renderFilters(products);
                renderProducts();
            } catch (error) {
                elements.productList.innerHTML = `<p class="col-span-full text-center text-red-500 py-20">Failed to load products.</p>`;
            }
        }

        function renderFilters(prods) {
            const categories = [...new Set(prods.map(p => p.category))];
            let options = '<option value="all">All</option>';
            categories.forEach(cat => {
                const displayName = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                options += `<option value="${cat}">${displayName}</option>`;
            });
            elements.categorySelect.innerHTML = options;
        }

        function filterProducts() {
            const category = elements.categorySelect.value;
            const searchTerm = elements.searchInput.value.toLowerCase();

            const filtered = products.filter(p => {
                const matchesCategory = category === 'all' || p.category === category;
                const matchesSearch = searchTerm === '' || 
                                      p.title.toLowerCase().includes(searchTerm) || 
                                      p.description.toLowerCase().includes(searchTerm);
                return matchesCategory && matchesSearch;
            });

            renderProducts(filtered);
        }

        function renderProducts(prods = products) {
            if (prods.length === 0) {
                elements.productList.innerHTML = `<p class="col-span-full text-center text-gray-500 py-20">No products match your filters.</p>`;
                return;
            }

            elements.productList.innerHTML = prods.map(p => `
                <div class="product-card p-5 rounded-xl shadow-xl flex flex-col justify-between border border-gray-200 hover:ring-2 hover:ring-blue-500 transition duration-300 bg-white">
                    <img src="${p.image}" alt="${p.title}" class="w-full h-40 object-contain mb-4 rounded-lg mix-blend-multiply">
                    <h3 class="font-bold text-gray-800 mb-1 truncate">${p.title}</h3>
                    <p class="text-xs text-gray-500 mb-3">${p.category}</p>
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-2xl font-extrabold text-blue-600">\$${p.price.toFixed(2)}</span>
                        <div class="text-yellow-500 text-sm flex items-center">
                            ${'★'.repeat(Math.round(p.rating.rate))}
                        </div>
                    </div>
                    <button onclick="addToCart(${p.id})" class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Add to Cart</button>
                </div>
            `).join('');
        }

        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            const cartItem = cart.find(item => item.id === productId);

            if (cartItem) {
                cartItem.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
            saveCart();
            showMessage(`Added 1 x ${product.title.substring(0, 20)}...`);
        }

        function updateQuantity(productId, delta) {
            const cartItem = cart.find(item => item.id === productId);
            if (!cartItem) return;

            cartItem.quantity += delta;

            if (cartItem.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart();
            }
        }

        function removeFromCart(productId) {
            cart = cart.filter(item => item.id !== productId);
            saveCart();
        }

        function calculateTotal() {
            return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        }

        function renderCartItems() {
            elements.cartItems.innerHTML = '';
            
            if (cart.length === 0) {
                elements.emptyCartMessage.classList.remove('hidden');
                elements.cartItems.appendChild(elements.emptyCartMessage);
            } else {
                elements.emptyCartMessage.classList.add('hidden');
                cart.forEach(item => {
                    const totalItemPrice = item.price * item.quantity;
                    const div = document.createElement('div');
                    div.className = 'flex items-center space-x-4 py-3 border-b border-gray-100';
                    div.innerHTML = `
                        <img src="${item.image}" alt="${item.title}" class="w-10 h-10 object-contain rounded-md">
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-800 truncate">${item.title}</p>
                            <p class="text-sm text-gray-500">\$${item.price.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="updateQuantity(${item.id}, -1)" class="p-1 text-gray-500 hover:text-red-500 rounded-full">-</button>
                            <span class="font-semibold text-gray-800 w-4 text-center">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="p-1 text-gray-500 hover:text-green-500 rounded-full">+</button>
                        </div>
                        <span class="font-bold text-gray-800 w-20 text-right">\$${totalItemPrice.toFixed(2)}</span>
                    `;
                    elements.cartItems.appendChild(div);
                });
            }
        }

        function updateCartUI() {
            renderCartItems();
            const total = calculateTotal();
            elements.totalAmount.textContent = `\$${total.toFixed(2)}`;
            
            elements.cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
            
            const isDisabled = cart.length === 0;
            elements.checkoutBtn.disabled = isDisabled;
            elements.checkoutBtn.classList.toggle('opacity-50', isDisabled);
        }

        function openModal(modal, content) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('opacity-100');
                content.classList.remove('translate-y-full');
            }, 10);
        }

        function closeModal(modal, content) {
            modal.classList.remove('opacity-100');
            content.classList.add('translate-y-full');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }

        function showCheckout() {
            if (cart.length === 0) {
                showMessage("Cart is empty.");
                return;
            }
            
            const total = calculateTotal();
            showMessage(`Order Total: \$${total.toFixed(2)}! Thanks for shopping.`);

            cart = [];
            localStorage.removeItem('shoppingCart');
            updateCartUI();
            closeModal(elements.cartModal, elements.cartContent);
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadCart();
            fetchProducts();
            
            elements.cartToggle.addEventListener('click', () => openModal(elements.cartModal, elements.cartContent));
            document.getElementById('close-cart-btn').addEventListener('click', () => closeModal(elements.cartModal, elements.cartContent));
            elements.checkoutBtn.addEventListener('click', showCheckout);

            elements.categorySelect.addEventListener('change', filterProducts);
            elements.searchInput.addEventListener('input', filterProducts);

            elements.cartModal.addEventListener('click', (e) => {
                if (e.target.id === 'cart-modal') closeModal(elements.cartModal, elements.cartContent);
            });
        });