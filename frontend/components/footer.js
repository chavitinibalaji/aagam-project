// Footer Component for AAGAM
class FooterComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-top: auto;
                }

                .footer {
                    background: #1a1a1a;
                    color: #fff;
                    padding: 40px 20px 20px;
                    margin-top: 50px;
                }

                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                    margin-bottom: 30px;
                }

                .footer-section h3 {
                    color: #00b761;
                    margin-bottom: 15px;
                    font-size: 18px;
                    font-weight: 600;
                }

                .footer-section ul {
                    list-style: none;
                    padding: 0;
                }

                .footer-section ul li {
                    margin-bottom: 8px;
                }

                .footer-section ul li a {
                    color: #ccc;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }

                .footer-section ul li a:hover {
                    color: #00b761;
                }

                .footer-section p {
                    color: #ccc;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }

                .social-links {
                    display: flex;
                    gap: 15px;
                    margin-top: 15px;
                }

                .social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: #333;
                    border-radius: 50%;
                    color: #fff;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 18px;
                }

                .social-link:hover {
                    background: #00b761;
                    transform: translateY(-2px);
                }

                .newsletter {
                    margin-top: 20px;
                }

                .newsletter-form {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .newsletter-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #444;
                    border-radius: 5px;
                    background: #333;
                    color: #fff;
                }

                .newsletter-input::placeholder {
                    color: #999;
                }

                .newsletter-btn {
                    padding: 10px 20px;
                    background: #00b761;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background-color 0.3s ease;
                }

                .newsletter-btn:hover {
                    background: #005a3d;
                }

                .footer-bottom {
                    border-top: 1px solid #333;
                    padding-top: 20px;
                    text-align: center;
                    color: #888;
                }

                .footer-bottom-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .copyright {
                    font-size: 14px;
                }

                .footer-links {
                    display: flex;
                    gap: 20px;
                    font-size: 14px;
                }

                .footer-links a {
                    color: #888;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }

                .footer-links a:hover {
                    color: #00b761;
                }

                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .footer-bottom-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .footer-links {
                        justify-content: center;
                    }

                    .newsletter-form {
                        flex-direction: column;
                    }

                    .social-links {
                        justify-content: center;
                    }
                }
            </style>

            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-grid">
                        <div class="footer-section">
                            <h3>AAGAM</h3>
                            <p>Your trusted partner for fresh groceries and daily essentials. We deliver quality products right to your doorstep with fast and reliable service.</p>
                            <div class="social-links">
                                <a href="#" class="social-link" title="Facebook">📘</a>
                                <a href="#" class="social-link" title="Instagram">📷</a>
                                <a href="#" class="social-link" title="Twitter">🐦</a>
                                <a href="#" class="social-link" title="YouTube">📺</a>
                            </div>
                        </div>

                        <div class="footer-section">
                            <h3>Quick Links</h3>
                            <ul>
                                <li><a href="index.html">Home</a></li>
                                <li><a href="#categories">Categories</a></li>
                                <li><a href="#offers">Offers</a></li>
                                <li><a href="cart.html">Cart</a></li>
                                <li><a href="orders.html">My Orders</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Customer Service</h3>
                            <ul>
                                <li><a href="#contact">Contact Us</a></li>
                                <li><a href="#faq">FAQ</a></li>
                                <li><a href="#shipping">Shipping Info</a></li>
                                <li><a href="#returns">Returns & Refunds</a></li>
                                <li><a href="#privacy">Privacy Policy</a></li>
                            </ul>
                        </div>

                        <div class="footer-section">
                            <h3>Stay Connected</h3>
                            <p>Subscribe to our newsletter for the latest offers and updates.</p>
                            <div class="newsletter">
                                <div class="newsletter-form">
                                    <input type="email" class="newsletter-input" placeholder="Enter your email" id="newsletterEmail">
                                    <button class="newsletter-btn" onclick="subscribeNewsletter()">Subscribe</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <div class="footer-bottom-content">
                            <div class="copyright">
                                © 2024 AAGAM. All rights reserved.
                            </div>
                            <div class="footer-links">
                                <a href="#terms">Terms of Service</a>
                                <a href="#privacy">Privacy Policy</a>
                                <a href="#cookies">Cookie Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

// Newsletter subscription function
function subscribeNewsletter() {
    const emailInput = document.querySelector('#newsletterEmail');
    const email = emailInput.value.trim();

    if (!email) {
        alert('Please enter your email address');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // In a real app, this would send the email to the server
    alert('Thank you for subscribing! You will receive our latest updates.');
    emailInput.value = '';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Register the component
customElements.define('aagam-footer', FooterComponent);