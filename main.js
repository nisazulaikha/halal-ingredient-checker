/**
 * Halal Ingredient Checker - Main JavaScript File
 * Handles ingredient checking, API calls, chat functionality, and UI interactions
 */

class HalalIngredientChecker {
    constructor() {
        // Configuration with updated endpoints and settings
        this.config = {
            apiEndpoints: {
                primary: 'https://fb62-27-125-241-114.ngrok-free.app/webhook/ingredient-check',
                responseUrl: 'https://fb62-27-125-241-114.ngrok-free.app/webhook/f3f51804-fafc-4103-bff9-4dc5ab97ff2f/response',
                chatResponseUrl: 'https://fb62-27-125-241-114.ngrok-free.app/webhook/bb06b7cf-8a49-4f1e-ba44-ca85271eeaf6/response/chat'
            },
            useMockData: false, // Set to false for live data, adjust if needed
            notificationThresholdDays: 30,
            chatId: 'session_' + Date.now(),
            polling: {
                maxAttempts: 15,
                initialDelay: 1000,
                backoffMultiplier: 1.2,
                maxDelay: 5000
            }
        };
        
        // Debug logging
        this.debugLog = [];
        
        // Chat history
        this.chatHistory = [];

        // Mock data for testing
        this.mockIngredientData = {
            'corn starch': {
                status: 'Certified',
                expiryDate: '2025-12-15',
                supplier: 'Halal Foods Sdn Bhd',
                certificateId: 'JAKIM-2024-001'
            },
            'soy lecithin': {
                status: 'Certified',
                expiryDate: '2025-07-10',
                supplier: 'Malaysian Soy Industries',
                certificateId: 'JAKIM-2024-002'
            },
            'vanilla extract': {
                status: 'Certified',
                expiryDate: '2025-08-15',
                supplier: 'Flavor Masters Sdn Bhd',
                certificateId: 'JAKIM-2024-015'
            },
            'citric acid': {
                status: 'Certified',
                expiryDate: '2025-11-30',
                supplier: 'Chemical Solutions Malaysia',
                certificateId: 'JAKIM-2024-020'
            },
            'xanthan gum': {
                status: 'Certified',
                expiryDate: '2026-03-20',
                supplier: 'Biotech Ingredients Malaysia',
                certificateId: 'JAKIM-2024-008'
            },
            'lecithin': {
                status: 'Certified',
                expiryDate: '2025-09-30',
                supplier: 'Natural Ingredients Co.',
                certificateId: 'JAKIM-2024-012'
            },
            'gellan gum': {
                status: 'Certified',
                expiryDate: '2025-11-15',
                supplier: 'Bio Gums Malaysia',
                certificateId: 'JAKIM-2024-018'
            }
        };

        // Mock chat responses
        this.mockChatResponses = {
            'halal': 'Halal refers to what is permissible according to Islamic law. In food, it means the food is prepared according to Islamic dietary guidelines.',
            'haram': 'Haram refers to anything forbidden by Islamic law. Common haram ingredients include pork, alcohol, and certain food additives.',
            'certificate': 'Halal certificates are issued by recognized Islamic organizations to verify that products comply with Islamic dietary laws.',
            'gelatin': 'Gelatin can be halal or haram depending on its source. Gelatin from halal-slaughtered animals or fish is halal, while gelatin from pork is haram.',
            'alcohol': 'Alcohol is generally considered haram in Islam. However, some scholars allow trace amounts that occur naturally in food processing.',
            'chicken': 'Chicken is halal if it\'s slaughtered according to Islamic guidelines by a Muslim who says "Bismillah" (In the name of Allah).',
            'beef': 'Beef is halal when the cattle is slaughtered according to Islamic law, ensuring the animal is healthy and the slaughter is performed correctly.',
            'pork': 'Pork is haram (forbidden) in Islam and cannot be consumed by Muslims under any circumstances.',
            'wine': 'Wine contains alcohol and is considered haram in Islam. Muslims should avoid consuming wine and products containing wine.',
            'certification': 'Halal certification ensures that food products comply with Islamic dietary laws. Look for certificates from recognized Islamic authorities like JAKIM in Malaysia.'
        };
    }

    // Initialize the application
    init() {
        this.log('Initializing Halal Ingredient Checker...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.checkNotificationPermission();
        this.setupConfigurationHandlers();
        this.initializeChat();
        this.autoSaveInput();
        this.setupServiceWorker();
        this.setupKeyboardShortcuts();
        this.addExportButton();
        
        // Set initial configuration
        this.updateConfigFromUI();
        this.log('App initialized successfully');
    }

    // Debug logging functionality
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.debugLog.push(logEntry);
        console.log(logEntry);
        
        // Keep only last 100 entries
        if (this.debugLog.length > 100) {
            this.debugLog = this.debugLog.slice(-100);
        }
        
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        const debugLogElement = document.getElementById('debugLog');
        if (debugLogElement) {
            debugLogElement.textContent = this.debugLog.join('\n');
            debugLogElement.scrollTop = debugLogElement.scrollHeight;
        }
    }

    toggleDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    clearDebugLog() {
        this.debugLog = [];
        this.updateDebugPanel();
    }

    // Configuration handlers
    setupConfigurationHandlers() {
        const mockDataCheckbox = document.getElementById('useMockData');
        const apiUrlInput = document.getElementById('apiUrl');
        const responseUrlInput = document.getElementById('responseUrl');
        const chatResponseUrlInput = document.getElementById('chatResponseUrl');
        
        if (mockDataCheckbox) {
            mockDataCheckbox.addEventListener('change', (e) => {
                this.config.useMockData = e.target.checked;
                this.log(`Mock data mode: ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }
        
        if (apiUrlInput) {
            apiUrlInput.addEventListener('input', (e) => {
                this.config.apiEndpoints.primary = e.target.value;
                this.log(`API URL updated: ${e.target.value}`);
            });
        }

        if (responseUrlInput) {
            responseUrlInput.addEventListener('input', (e) => {
                this.config.apiEndpoints.responseUrl = e.target.value;
                this.log(`Response URL updated: ${e.target.value}`);
            });
        }
        
        if (chatResponseUrlInput) {
            chatResponseUrlInput.addEventListener('input', (e) => {
                this.config.apiEndpoints.chatResponseUrl = e.target.value;
                this.log(`Chat Response URL updated: ${e.target.value}`);
            });
        }
    }

    updateConfigFromUI() {
        const mockDataCheckbox = document.getElementById('useMockData');
        const apiUrlInput = document.getElementById('apiUrl');
        const responseUrlInput = document.getElementById('responseUrl');
        const chatResponseUrlInput = document.getElementById('chatResponseUrl');
        
        if (mockDataCheckbox) this.config.useMockData = mockDataCheckbox.checked;
        if (apiUrlInput) this.config.apiEndpoints.primary = apiUrlInput.value;
        if (responseUrlInput) this.config.apiEndpoints.responseUrl = responseUrlInput.value;
        if (chatResponseUrlInput) this.config.apiEndpoints.chatResponseUrl = chatResponseUrlInput.value;
    }

    // Enhanced API call with better error handling
    async makeApiCall(url, options = {}) {
        const attempts = [
            // Attempt 1: Direct call with proper headers
            () => {
                this.log(`Direct API call to: ${url}`);
                return fetch(url, {
                    ...options,
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                        ...options.headers
                    }
                });
            },
            
            // Attempt 2: Simplified call
            () => {
                this.log(`Simplified API call to: ${url}`);
                return fetch(url, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: options.body,
                    mode: 'cors'
                });
            },
            
            // Attempt 3: Using CORS proxy (if available)
            () => {
                const proxyUrl = this.config.apiEndpoints.proxyPrefix + url;
                this.log(`CORS proxy call to: ${proxyUrl}`);
                return fetch(proxyUrl, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
            }
        ];

        for (let i = 0; i < attempts.length; i++) {
            try {
                this.log(`API attempt ${i + 1} starting...`);
                const response = await attempts[i]();
                
                if (response.ok) {
                    this.log(`API attempt ${i + 1} succeeded with status: ${response.status}`);
                    return response;
                } else {
                    this.log(`API attempt ${i + 1} failed with status: ${response.status}`, 'warn');
                }
            } catch (error) {
                this.log(`API attempt ${i + 1} failed with error: ${error.message}`, 'error');
                
                if (i === attempts.length - 1) {
                    throw new Error(`All API attempts failed. Last error: ${error.message}`);
                }
            }
        }
    }

    // Notification functions
    checkNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const notificationDiv = document.getElementById('notificationPermission');
            if (notificationDiv) {
                notificationDiv.style.display = 'block';
            }
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    const notificationDiv = document.getElementById('notificationPermission');
                    if (notificationDiv) {
                        notificationDiv.style.display = 'none';
                    }
                    this.showNotification('Notifications enabled!', 'You will now receive alerts about expiring certificates.');
                }
            });
        }
    }

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%234CAF50"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">🥗</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%234CAF50"/></svg>'
            });
        }
    }

    // Service Worker setup
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            const swCode = `
                self.addEventListener('install', function(event) {
                    console.log('Service Worker installing');
                    self.skipWaiting();
                });
                
                self.addEventListener('activate', function(event) {
                    console.log('Service Worker activated');
                    event.waitUntil(clients.claim());
                });
                
                self.addEventListener('notificationclick', function(event) {
                    event.notification.close();
                    event.waitUntil(
                        clients.openWindow('/')
                    );
                });
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            navigator.serviceWorker.register(swUrl)
                .then(registration => this.log('Service Worker registered successfully'))
                .catch(error => this.log('Service Worker registration failed: ' + error.message, 'error'));
        }
    }

    // Auto-save input
    autoSaveInput() {
        const input = document.getElementById('ingredientsInput');
        if (!input) return;

        const savedInput = localStorage.getItem('halal_checker_input');
        
        if (savedInput) {
            input.value = savedInput;
        }
        
        input.addEventListener('input', function() {
            localStorage.setItem('halal_checker_input', this.value);
        });
    }

    // Main ingredient checking function
    async checkIngredients() {
        const input = document.getElementById('ingredientsInput');
        if (!input) return;

        const ingredients = input.value
            .split('\n')
            .map(item => item.trim().toLowerCase())
            .filter(item => item.length > 0);

        if (ingredients.length === 0) {
            this.showAlert('Please enter at least one ingredient', 'error');
            return;
        }

        this.log(`Checking ${ingredients.length} ingredients...`);
        this.setLoadingState(true);

        try {
            let results;
            
            if (this.config.useMockData) {
                this.log('Using mock data for ingredient check');
                results = this.getMockResults(ingredients);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
            } else {
                results = await this.checkIngredientsAPI(ingredients);
            }

            this.displayResults(results);
            this.updateStats(results);
            this.checkForExpiringCertificates(results);
            
            this.log(`Successfully checked ${ingredients.length} ingredients`);
            
        } catch (error) {
            this.log(`Error checking ingredients: ${error.message}`, 'error');
            this.showAlert('Failed to check ingredients. Please try again or enable mock data mode.', 'error');
            
            // Fallback to mock data if API fails
            if (!this.config.useMockData) {
                this.log('Falling back to mock data due to API error');
                const mockResults = this.getMockResults(ingredients);
                this.displayResults(mockResults);
                this.updateStats(mockResults);
                this.showAlert('Using demo data due to connection issues', 'warning');
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    // API ingredient checking
    async checkIngredientsAPI(ingredients) {
        this.log('Starting API ingredient check...');
        const requestData = {
            ingredients,
            chatId: this.config.chatId,
            responseUrl: this.config.apiEndpoints.responseUrl,
            timestamp: Date.now()
        };
        try {
            const response = await this.makeApiCall(this.config.apiEndpoints.primary, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error(responseData.error || 'API error');
            }
            this.log('Received API response, starting polling for results...');
            return await this.pollForResults(responseData.chatId || this.config.chatId);
        } catch (error) {
            this.log(`API call failed: ${error.message}`, 'error');
            this.showAlert(error.message, 'error');
            throw error;
        }
    }

    // Poll for results from the API
    async pollForResults(requestId) {
        const { maxAttempts, initialDelay, backoffMultiplier, maxDelay } = this.config.polling;
        let delay = initialDelay;
        this.log(`Starting to poll for results (ID: ${requestId})`);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                this.log(`Polling attempt ${attempt}/${maxAttempts} (delay: ${delay}ms)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                const response = await this.makeApiCall(`${this.config.apiEndpoints.responseUrl}/${requestId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.value) {
                        const parsedData = JSON.parse(data.value);
                        if (parsedData.results && parsedData.results.length > 0) {
                            this.log(`Results received after ${attempt} attempts`);
                            return parsedData.results;
                        }
                        this.log(`Still processing... (attempt ${attempt})`);
                    }
                }
                delay = Math.min(delay * backoffMultiplier, maxDelay);
            } catch (error) {
                this.log(`Polling attempt ${attempt} error: ${error.message}`, 'error');
            }
        }
        throw new Error(`Failed to get results after ${maxAttempts} attempts`);
    }

    // Generate mock results for testing
    getMockResults(ingredients) {
        return ingredients.map(ingredient => {
            const mockData = this.mockIngredientData[ingredient.toLowerCase()];
            
            if (mockData) {
                return {
                    ingredient: ingredient,
                    status: mockData.status,
                    expiryDate: mockData.expiryDate,
                    supplier: mockData.supplier,
                    certificateId: mockData.certificateId
                };
            } else {
                return {
                    ingredient: ingredient,
                    status: 'Not Found',
                    expiryDate: 'N/A',
                    supplier: 'Unknown',
                    certificateId: 'N/A'
                };
            }
        });
    }

    // Display results in the table
    displayResults(results) {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        results.forEach(result => {
            const row = document.createElement('tr');
            const statusClass = this.getStatusClass(result.status, result.expiryDate);
            row.innerHTML = `
                <td style="font-weight: 600;">${this.capitalizeFirst(result.ingredient)}</td>
                <td><span class="status-cell ${statusClass}">${result.status}</span></td>
                <td>${this.formatDate(result.expiryDate)}</td>
                <td>${result.supplier}</td>
                <td>${result.certificateId || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            statsSection.style.display = 'block';
        }
    }

    // Get status class for styling
    getStatusClass(status, expiryDate) {
        if (status === 'Certified') {
            if (this.isExpiringWithin30Days(expiryDate)) {
                return 'status-expiring';
            }
            return 'status-certified';
        } else if (status === 'Expired' || status === 'Not Found') {
            return 'status-expired';
        }
        return 'status-not-found';
    }

    // Check if certificate is expiring within 30 days
    isExpiringWithin30Days(expiryDate) {
        if (!expiryDate || expiryDate === 'N/A') return false;
        
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= this.config.notificationThresholdDays && diffDays > 0;
    }

    // Update statistics display
    updateStats(results) {
        const total = results.length;
        const certified = results.filter(r => r.status === 'Certified' && !this.isExpiringWithin30Days(r.expiryDate)).length;
        const expiring = results.filter(r => r.status === 'Certified' && this.isExpiringWithin30Days(r.expiryDate)).length;
        const issues = results.filter(r => r.status !== 'Certified' || this.isExpiringWithin30Days(r.expiryDate)).length;

        const elements = {
            totalCount: document.getElementById('totalCount'),
            certifiedCount: document.getElementById('certifiedCount'),
            expiringCount: document.getElementById('expiringCount'),
            issuesCount: document.getElementById('issuesCount')
        };

        if (elements.totalCount) elements.totalCount.textContent = total;
        if (elements.certifiedCount) elements.certifiedCount.textContent = certified;
        if (elements.expiringCount) elements.expiringCount.textContent = expiring;
        if (elements.issuesCount) elements.issuesCount.textContent = issues;
    }

    // Check for expiring certificates and show notifications
    checkForExpiringCertificates(results) {
        const expiring = results.filter(r => this.isExpiringWithin30Days(r.expiryDate));
        
        if (expiring.length > 0) {
            const ingredientNames = expiring.map(r => r.ingredient).join(', ');
            this.showNotification(
                'Certificates Expiring Soon!',
                `${expiring.length} certificate(s) expiring within 30 days: ${ingredientNames}`
            );
            
            this.showAlert(
                `Warning: ${expiring.length} certificate(s) expiring within 30 days`,
                'warning'
            );
        }
    }

    // Utility functions
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        
        try {
            return new Date(dateStr).toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    setLoadingState(loading) {
        const btn = document.querySelector('.check-btn');
        const btnText = document.getElementById('checkBtnText');
        
        if (btn && btnText) {
            if (loading) {
                btn.disabled = true;
                btn.classList.add('loading');
                btnText.textContent = 'Checking...';
            } else {
                btn.disabled = false;
                btn.classList.remove('loading');
                btnText.textContent = 'Check Ingredients';
            }
        }
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert:not(.alert-warning)');
        existingAlerts.forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `<strong>${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success'}:</strong> ${message}`;
        
        const container = document.querySelector('.panel');
        const statsSection = document.getElementById('statsSection');
        if (container && statsSection) {
            container.insertBefore(alert, statsSection);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    clearResults() {
        const input = document.getElementById('ingredientsInput');
        const resultsBody = document.getElementById('resultsBody');
        const statsSection = document.getElementById('statsSection');

        if (input) input.value = '';
        
        if (resultsBody) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        Enter ingredients above and click "Check Ingredients" to see results
                    </td>
                </tr>
            `;
        }
        
        if (statsSection) {
            statsSection.style.display = 'none';
        }
        
        localStorage.removeItem('halal_checker_input');
        
        // Clear any alerts
        const alerts = document.querySelectorAll('.alert:not(.alert-warning)');
        alerts.forEach(alert => alert.remove());
        
        this.log('Results cleared');
    }

    // Chat functionality
    initializeChat() {
        this.log('Initializing chat...');
        
        // Load chat history from localStorage
        const savedHistory = localStorage.getItem('halal_chat_history');
        if (savedHistory) {
            try {
                this.chatHistory = JSON.parse(savedHistory);
                this.displayChatHistory();
            } catch (error) {
                this.log('Failed to load chat history: ' + error.message, 'error');
            }
        }
    }

    displayChatHistory() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        // Clear existing messages except the initial welcome message
        const welcomeMessage = messagesContainer.querySelector('.message-ai');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
        
        // Display chat history
        this.chatHistory.forEach(message => {
            this.displayMessage(message.content, message.isUser, false);
        });
    }

    handleChatKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;

        const message = input.value.trim();
        
        if (!message) return;
        
        this.log(`Sending chat message: ${message}`);
        
        // Display user message
        this.displayMessage(message, true);
        input.value = '';
        
        // Add to history and save
        this.chatHistory.push({ content: message, isUser: true, timestamp: Date.now() });
        this.saveChatHistory();
        
        // Set loading state
        this.setChatLoadingState(true);
        
        try {
            let response;
            
            if (this.config.useMockData) {
                response = await this.getMockChatResponse(message);
            } else {
                response = await this.getChatResponseAPI(message);
            }
            
            // Display AI response
            this.displayMessage(response, false);
            
            // Add to history and save
            this.chatHistory.push({ content: response, isUser: false, timestamp: Date.now() });
            this.saveChatHistory();
            
        } catch (error) {
            this.log(`Chat error: ${error.message}`, 'error');
            this.displayMessage('I apologize, but I\'m having trouble responding right now. Please try again later.', false);
        } finally {
            this.setChatLoadingState(false);
        }
    }

    displayMessage(content, isUser, scrollToBottom = true) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        if (scrollToBottom) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    setChatLoadingState(loading) {
        const btn = document.querySelector('.send-btn');
        const btnText = document.getElementById('sendBtnText');
        const input = document.getElementById('chatInput');
        
        if (loading) {
            if (btn) btn.disabled = true;
            if (input) input.disabled = true;
            if (btnText) btnText.textContent = 'Sending...';
            
            // Show typing indicator
            this.displayTypingIndicator();
        } else {
            if (btn) btn.disabled = false;
            if (input) input.disabled = false;
            if (btnText) btnText.textContent = 'Send';
            
            // Remove typing indicator
            this.removeTypingIndicator();
        }
    }

    displayTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-ai typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = 'AI is typing<span class="dots">...</span>';
        
        typingDiv.appendChild(contentDiv);
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getMockChatResponse(message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const lowerMessage = message.toLowerCase();
        
        // Check for keywords in the message
        for (const keyword in this.mockChatResponses) {
            if (lowerMessage.includes(keyword)) {
                return this.mockChatResponses[keyword];
            }
        }
        
        // Default responses based on message type
        if (lowerMessage.includes('?')) {
            return "That's a great question! I'd be happy to help you with halal ingredient information. Try asking about specific ingredients, certification processes, or halal dietary guidelines.";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! I'm here to help with any halal ingredient questions you might have.";
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm here to help you with halal ingredient information. Feel free to ask me about any ingredients or halal dietary guidelines.";
        } else {
            return "I understand you're asking about halal ingredients. Could you be more specific about what you'd like to know? I can help with ingredient certification, dietary guidelines, or specific food items.";
        }
    }

    async getChatResponseAPI(message) {
        this.log('Sending chat message to API...');
        const requestData = {
            message,
            chatId: this.config.chatId,
            responseUrl: this.config.apiEndpoints.chatResponseUrl,
            timestamp: Date.now()
        };
        try {
            const response = await this.makeApiCall(this.config.apiEndpoints.primary + '/chat', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error(responseData.error || 'Chat API error');
            }
            return await this.pollForChatResponse(responseData.chatId || this.config.chatId);
        } catch (error) {
            this.log(`Chat API call failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async pollForChatResponse(requestId) {
        const { maxAttempts, initialDelay, backoffMultiplier, maxDelay } = this.config.polling;
        let delay = initialDelay;
        this.log(`Polling for chat response (ID: ${requestId})`);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await new Promise(resolve => setTimeout(resolve, delay));
                const response = await this.makeApiCall(`${this.config.apiEndpoints.chatResponseUrl}/${requestId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.value) {
                        const parsedData = JSON.parse(data.value);
                        if (parsedData.response) {
                            this.log(`Chat response received after ${attempt} attempts`);
                            return parsedData.response;
                        }
                    }
                }
                delay = Math.min(delay * backoffMultiplier, maxDelay);
            } catch (error) {
                this.log(`Chat polling attempt ${attempt} error: ${error.message}`, 'error');
            }
        }
        throw new Error(`Failed to get chat response after ${maxAttempts} attempts`);
    }

    saveChatHistory() {
        try {
            // Keep only last 50 messages to prevent localStorage bloat
            if (this.chatHistory.length > 50) {
                this.chatHistory = this.chatHistory.slice(-50);
            }
            
            localStorage.setItem('halal_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            this.log('Failed to save chat history: ' + error.message, 'error');
        }
    }

    clearChat() {
        this.chatHistory = [];
        localStorage.removeItem('halal_chat_history');
        
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="message message-ai">
                    <div class="message-content">
                        Hello! I'm your Halal Ingredient Assistant. Ask me anything about halal certification, ingredients, or dietary guidelines.
                    </div>
                </div>
            `;
        }
        
        this.log('Chat history cleared');
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Enter to check ingredients
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                this.checkIngredients();
            }
            
            // Ctrl+R to clear results
            if (event.ctrlKey && event.key === 'r') {
                event.preventDefault();
                this.clearResults();
            }
            
            // F1 to toggle debug panel
            if (event.key === 'F1') {
                event.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    // Export functionality
    addExportButton() {
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Results';
        exportBtn.className = 'export-btn';
        exportBtn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
            font-size: 14px;
        `;
        
        exportBtn.addEventListener('click', () => this.exportResults());
        
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.appendChild(exportBtn);
        }
    }

    exportResults() {
        const resultsBody = document.getElementById('resultsBody');
        if (!resultsBody || resultsBody.children.length === 0) {
            this.showAlert('No results to export', 'warning');
            return;
        }
        const results = [];
        const rows = resultsBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 5) {
                results.push({
                    ingredient: cells[0].textContent.trim(),
                    status: cells[1].textContent.trim(),
                    expiryDate: cells[2].textContent.trim(),
                    supplier: cells[3].textContent.trim(),
                    certificateId: cells[4].textContent.trim()
                });
            }
        });
        if (results.length === 0) {
            this.showAlert('No valid results to export', 'warning');
            return;
        }
        const csvContent = [
            ['Ingredient', 'Status', 'Expiry Date', 'Supplier', 'Certificate ID'],
            ...results.map(r => [r.ingredient, r.status, r.expiryDate, r.supplier, r.certificateId])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `halal_ingredients_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showAlert('Results exported successfully!', 'success');
        this.log('Results exported to CSV');
    }

    // Utility method to get current stats
    getCurrentStats() {
        const stats = {
            total: parseInt(document.getElementById('totalCount')?.textContent || '0'),
            certified: parseInt(document.getElementById('certifiedCount')?.textContent || '0'),
            expiring: parseInt(document.getElementById('expiringCount')?.textContent || '0'),
            issues: parseInt(document.getElementById('issuesCount')?.textContent || '0')
        };
        
        return stats;
    }

    // Method to refresh configuration
    refreshConfig() {
        this.updateConfigFromUI();
        this.log('Configuration refreshed');
    }

    // Method to get app status
    getAppStatus() {
        return {
            version: '1.0.0',
            mockMode: this.config.useMockData,
            apiEndpoint: this.config.apiEndpoints.primary,
            chatHistorySize: this.chatHistory.length,
            debugLogSize: this.debugLog.length,
            notificationsEnabled: 'Notification' in window && Notification.permission === 'granted'
        };
    }
}

// Initialize the app when DOM is ready
const halalChecker = new HalalIngredientChecker();
halalChecker.init();

// Make globally accessible for debugging
window.halalChecker = halalChecker;
