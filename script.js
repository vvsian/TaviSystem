// Leitner System Flashcard Application

// Data structure to store flashcards
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
let currentStudyBox = null;
let currentCardIndex = 0;
let studySession = {
    correctCount: 0,
    incorrectCount: 0,
    skippedCount: 0,
    cardsToStudy: [],
    startTime: null,
    endTime: null,
    totalTime: 0,
    timerEnabled: true,
    timerInterval: null,
    cardTimer: 0,
    maxCardTime: 30 // 30 seconds per card by default
};

// User profile data
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    username: '',
    totalCorrect: 0,
    totalIncorrect: 0,
    totalStudyTime: 0, // in seconds
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    dailyStudyGoal: 60 * 60, // 1 hour in seconds default
    weeklyStudyGoal: 5 * 60 * 60, // 5 hours in seconds default
    studyHistory: []
};

// DOM Elements
const createCardBtn = document.getElementById('create-card-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
const openProfileBtn = document.getElementById('open-profile-btn');
const createCardModal = document.getElementById('create-card-modal');
const studyModal = document.getElementById('study-modal');
const profileModal = document.getElementById('profile-modal');
const newCardForm = document.getElementById('new-card-form');
const closeButtons = document.querySelectorAll('.close-btn');
const studyBoxButtons = document.querySelectorAll('[id^="study-box-"]');
const flipBtn = document.getElementById('flip-btn');
const correctBtn = document.getElementById('correct-btn');
const incorrectBtn = document.getElementById('incorrect-btn');
const skipBtn = document.getElementById('skip-btn');
const exitStudyBtn = document.getElementById('exit-study-btn');
const finishStudyBtn = document.getElementById('finish-study-btn');
const tryAgainBtn = document.getElementById('try-again-btn');
const currentCard = document.getElementById('current-card');
const timerDisplay = document.getElementById('timer-display');
const timerProgress = document.getElementById('timer-progress');
const toggleTimerBtn = document.getElementById('toggle-timer-btn');
const progressFill = document.getElementById('progress-fill');
const totalStudyTime = document.getElementById('total-study-time');
const skippedCount = document.getElementById('skipped-count');
const cardCategoryDisplay = document.getElementById('card-category-display');
const completionMessage = document.getElementById('completion-message');

// Initialize the application
function init() {
    updateUI();
    setupEventListeners();
    updateProfileUI();
    updateWelcomeMessage();
}

// Update UI elements with current data
function updateUI() {
    updateStats();
    updateBoxes();
}

// Update statistics display
function updateStats() {
    const totalCards = flashcards.length;
    const masteredCards = flashcards.filter(card => card.box === 3 && isCardMastered(card)).length;
    const cardsToReview = getCardsToReviewToday().length;
    
    document.getElementById('total-cards').textContent = totalCards;
    document.getElementById('cards-mastered').textContent = masteredCards;
    document.getElementById('cards-to-review').textContent = cardsToReview;
}

// Check if a card is mastered (has been in box 3 for at least 7 days)
function isCardMastered(card) {
    if (card.box !== 3) return false;
    const lastReviewDate = new Date(card.lastReviewed);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - lastReviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
}

// Get cards that need to be reviewed today
function getCardsToReviewToday() {
    const currentDate = new Date();
    return flashcards.filter(card => {
        if (!card.lastReviewed) return true;
        
        const lastReviewDate = new Date(card.lastReviewed);
        const diffTime = Math.abs(currentDate - lastReviewDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Box 1: Review daily
        if (card.box === 1) return diffDays >= 1;
        // Box 2: Review every 3 days
        if (card.box === 2) return diffDays >= 3;
        // Box 3: Review weekly
        if (card.box === 3) return diffDays >= 7;
        
        return false;
    });
}

// Update the boxes with flashcards
function updateBoxes() {
    // Clear all box containers
    for (let i = 1; i <= 3; i++) {
        const boxContainer = document.getElementById(`box-${i}-cards`);
        boxContainer.innerHTML = '';
        
        // Update count
        const boxCount = document.getElementById(`box-${i}-count`);
        const count = flashcards.filter(card => card.box === i).length;
        boxCount.textContent = count;
    }
    
    // Add cards to their respective boxes
    flashcards.forEach((card, index) => {
        const boxContainer = document.getElementById(`box-${card.box}-cards`);
        const cardElement = createCardPreview(card, index);
        boxContainer.appendChild(cardElement);
    });
}

// Create a preview element for a flashcard
function createCardPreview(card, index) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card-preview';
    cardElement.dataset.index = index;
    
    const cardContent = `
        <h3>${truncateText(card.question, 50)}</h3>
        ${card.category ? `<span class="card-category">${card.category}</span>` : ''}
        <div class="card-actions">
            <button class="card-action-btn edit-card" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="card-action-btn delete-card" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    cardElement.innerHTML = cardContent;
    
    // Add event listeners for card actions
    cardElement.querySelector('.edit-card').addEventListener('click', (e) => {
        e.stopPropagation();
        editCard(index);
    });
    
    cardElement.querySelector('.delete-card').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCard(index);
    });
    
    // View card details on click
    cardElement.addEventListener('click', () => {
        viewCardDetails(card);
    });
    
    return cardElement;
}

// Truncate text if it's too long
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Set up event listeners
function setupEventListeners() {
    // Open create card modal
    createCardBtn.addEventListener('click', () => {
        openModal(createCardModal);
    });
    
    // Delete all data button
    deleteAllBtn.addEventListener('click', () => {
        deleteAllData();
    });
    
    // Toggle theme button
    toggleThemeBtn.addEventListener('click', () => {
        toggleDarkMode();
    });
    
    // Open profile modal
    openProfileBtn.addEventListener('click', () => {
        updateProfileUI();
        openModal(profileModal);
    });
    
    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === createCardModal || e.target === studyModal || e.target === profileModal) {
            closeAllModals();
        }
    });
    
    // Form submission for new cards
    newCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        createNewCard();
    });
    
    // Study box buttons
    studyBoxButtons.forEach(button => {
        button.addEventListener('click', () => {
            const boxNumber = parseInt(button.id.split('-')[2]);
            startStudySession(boxNumber);
        });
    });
    
    // Flashcard study controls
    currentCard.addEventListener('click', flipCard);
    flipBtn.addEventListener('click', flipCard);
    correctBtn.addEventListener('click', markCardCorrect);
    incorrectBtn.addEventListener('click', markCardIncorrect);
    skipBtn.addEventListener('click', skipCard);
    exitStudyBtn.addEventListener('click', exitStudySession);
    finishStudyBtn.addEventListener('click', finishStudySession);
    tryAgainBtn.addEventListener('click', tryAgainStudySession);
    toggleTimerBtn.addEventListener('click', toggleTimer);
    
    // Profile tab buttons
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Remove active class from all tabs and panels
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            
            // Add active class to selected tab and panel
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setting event listeners for profile features
    document.getElementById('set-daily-goal-btn').addEventListener('click', setDailyStudyGoal);
    document.getElementById('set-weekly-goal-btn').addEventListener('click', setWeeklyStudyGoal);
    document.getElementById('save-username-btn').addEventListener('click', saveUsername);
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);
    document.getElementById('default-timer-toggle').addEventListener('change', updateTimerSetting);
    document.getElementById('card-time-input').addEventListener('change', updateCardTime);
    
    // Goal settings toggle buttons
    document.getElementById('daily-goal-settings-toggle').addEventListener('click', () => {
        toggleSettingsVisibility('daily-goal-settings');
    });
    
    document.getElementById('weekly-goal-settings-toggle').addEventListener('click', () => {
        toggleSettingsVisibility('weekly-goal-settings');
    });
    
    // Check for dark mode preference
    checkDarkModePreference();
}

// Open a modal
function openModal(modal) {
    modal.style.display = 'flex';
}

// Close all modals
function closeAllModals() {
    createCardModal.style.display = 'none';
    studyModal.style.display = 'none';
    profileModal.style.display = 'none';
    resetStudySession();
}

// Create a new flashcard
function createNewCard() {
    const question = document.getElementById('card-question').value.trim();
    const answer = document.getElementById('card-answer').value.trim();
    const category = document.getElementById('card-category').value.trim();
    
    if (!question || !answer) return;
    
    const newCard = {
        id: Date.now(),
        question,
        answer,
        category,
        box: 1,  // Start in box 1
        created: new Date().toISOString(),
        lastReviewed: null
    };
    
    flashcards.push(newCard);
    saveFlashcards();
    updateUI();
    
    // Reset form and close modal
    newCardForm.reset();
    closeAllModals();
    
    // Show success message
    showNotification('Flashcard created successfully!');
}

// Edit an existing flashcard
function editCard(index) {
    const card = flashcards[index];
    
    // Populate form with card data
    document.getElementById('card-question').value = card.question;
    document.getElementById('card-answer').value = card.answer;
    document.getElementById('card-category').value = card.category || '';
    
    // Change form submission behavior
    const submitBtn = newCardForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Flashcard';
    
    // Store the index for updating
    newCardForm.dataset.editIndex = index;
    
    // Change form submission handler
    newCardForm.onsubmit = function(e) {
        e.preventDefault();
        updateCard(index);
    };
    
    // Open modal
    openModal(createCardModal);
}

// Update an existing flashcard
function updateCard(index) {
    const question = document.getElementById('card-question').value.trim();
    const answer = document.getElementById('card-answer').value.trim();
    const category = document.getElementById('card-category').value.trim();
    
    if (!question || !answer) return;
    
    flashcards[index].question = question;
    flashcards[index].answer = answer;
    flashcards[index].category = category;
    
    saveFlashcards();
    updateUI();
    
    // Reset form and close modal
    newCardForm.reset();
    newCardForm.onsubmit = function(e) {
        e.preventDefault();
        createNewCard();
    };
    const submitBtn = newCardForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Create Flashcard';
    delete newCardForm.dataset.editIndex;
    
    closeAllModals();
    showNotification('Flashcard updated successfully!');
}

// Delete a flashcard
function deleteCard(index) {
    if (confirm('Are you sure you want to delete this flashcard?')) {
        flashcards.splice(index, 1);
        saveFlashcards();
        updateUI();
        showNotification('Flashcard deleted successfully!');
    }
}

// View card details
function viewCardDetails(card) {
    // Implement a view for card details if needed
    // For now, we'll just log the card
    console.log('Card details:', card);
}

// Start a study session for a specific box
function startStudySession(boxNumber) {
    currentStudyBox = boxNumber;
    
    // Get cards to study from this box
    const cardsInBox = flashcards.filter(card => card.box === boxNumber);
    
    // If there are no cards in this box, show a message
    if (cardsInBox.length === 0) {
        alert('No cards in this box to study!');
        return;
    }
    
    // Allow studying all cards in the box regardless of review schedule
    studySession.cardsToStudy = [...cardsInBox];
    
    // Shuffle the cards for random order
    studySession.cardsToStudy = shuffleArray(studySession.cardsToStudy);
    
    // Reset study session stats
    studySession.correctCount = 0;
    studySession.incorrectCount = 0;
    studySession.skippedCount = 0;
    studySession.startTime = new Date();
    studySession.endTime = null;
    studySession.totalTime = 0;
    currentCardIndex = 0;
    
    // Update study modal title
    document.getElementById('study-box-title').textContent = `Study Box ${boxNumber}`;
    
    // Update progress
    document.getElementById('cards-studied').textContent = currentCardIndex;
    document.getElementById('total-study-cards').textContent = studySession.cardsToStudy.length;
    updateProgressBar();
    
    // Show study container, hide completion screen
    document.querySelector('.study-container').style.display = 'flex';
    document.getElementById('study-complete').style.display = 'none';
    
    // Reset timer
    resetCardTimer();
    
    // Show the first card
    showCurrentCard();
    
    // Open the study modal
    openModal(studyModal);
    
    // Set active state on timer button if timer is enabled
    if (studySession.timerEnabled) {
        toggleTimerBtn.classList.add('active');
    } else {
        toggleTimerBtn.classList.remove('active');
    }
}

// Toggle the timer on/off
function toggleTimer() {
    studySession.timerEnabled = !studySession.timerEnabled;
    
    if (studySession.timerEnabled) {
        toggleTimerBtn.classList.add('active');
        resetCardTimer();
    } else {
        toggleTimerBtn.classList.remove('active');
        clearInterval(studySession.timerInterval);
        timerDisplay.textContent = '00:00';
        timerProgress.style.width = '0%';
    }
}

// Reset the card timer
function resetCardTimer() {
    // Clear any existing timer
    clearInterval(studySession.timerInterval);
    
    // Reset timer display
    studySession.cardTimer = 0;
    timerDisplay.textContent = '00:00';
    timerProgress.style.width = '0%';
    
    // Start a new timer if enabled
    if (studySession.timerEnabled) {
        studySession.timerInterval = setInterval(() => {
            studySession.cardTimer++;
            updateTimerDisplay();
            
            // Update progress bar
            const progressPercentage = (studySession.cardTimer / studySession.maxCardTime) * 100;
            timerProgress.style.width = `${Math.min(progressPercentage, 100)}%`;
            
            // Change color as time runs out
            if (progressPercentage > 80) {
                timerProgress.style.background = 'linear-gradient(90deg, rgba(255, 152, 0, 0.5), rgba(244, 67, 54, 0.5))';
            } else if (progressPercentage > 50) {
                timerProgress.style.background = 'linear-gradient(90deg, rgba(255, 235, 59, 0.5), rgba(255, 152, 0, 0.5))';
            }
            
            // Auto-flip card if time runs out and card is not flipped yet
            if (studySession.cardTimer >= studySession.maxCardTime && !currentCard.classList.contains('card-flipped')) {
                flipCard();
            }
        }, 1000);
    }
}

// Update the timer display
function updateTimerDisplay() {
    const minutes = Math.floor(studySession.cardTimer / 60);
    const seconds = studySession.cardTimer % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the progress bar
function updateProgressBar() {
    const progress = (currentCardIndex / studySession.cardsToStudy.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Show the current card in the study session
function showCurrentCard() {
    if (currentCardIndex >= studySession.cardsToStudy.length) {
        showStudyComplete();
        return;
    }
    
    const card = studySession.cardsToStudy[currentCardIndex];
    
    // Reset card flip state
    currentCard.classList.remove('card-flipped');
    
    // Update card content
    document.getElementById('card-question-display').textContent = card.question;
    document.getElementById('card-answer-display').textContent = card.answer;
    
    // Update category if available
    if (card.category && card.category.trim() !== '') {
        cardCategoryDisplay.textContent = card.category;
        cardCategoryDisplay.style.display = 'block';
    } else {
        cardCategoryDisplay.style.display = 'none';
    }
    
    // Update progress
    document.getElementById('cards-studied').textContent = currentCardIndex;
    updateProgressBar();
    
    // Reset the timer for the new card
    resetCardTimer();
}

// Flip the current card to show answer
function flipCard() {
    currentCard.classList.toggle('card-flipped');
}

// Mark the current card as correct
function markCardCorrect() {
    if (currentCardIndex >= studySession.cardsToStudy.length) return;
    
    const card = studySession.cardsToStudy[currentCardIndex];
    const cardIndex = flashcards.findIndex(c => c.id === card.id);
    
    // Promote card to next box if not already in box 3
    if (flashcards[cardIndex].box < 3) {
        flashcards[cardIndex].box++;
    }
    
    // Update last reviewed date
    flashcards[cardIndex].lastReviewed = new Date().toISOString();
    
    // Update study session stats
    studySession.correctCount++;
    
    // Update user profile stats
    userProfile.totalCorrect++;
    
    // Add XP for correct answer
    addXP(10);
    
    // Save changes
    saveFlashcards();
    saveUserProfile();
    
    // Move to next card
    currentCardIndex++;
    showCurrentCard();
}

// Mark the current card as incorrect
function markCardIncorrect() {
    if (currentCardIndex >= studySession.cardsToStudy.length) return;
    
    const card = studySession.cardsToStudy[currentCardIndex];
    const cardIndex = flashcards.findIndex(c => c.id === card.id);
    
    // Demote card to box 1
    flashcards[cardIndex].box = 1;
    
    // Update last reviewed date
    flashcards[cardIndex].lastReviewed = new Date().toISOString();
    
    // Update study session stats
    studySession.incorrectCount++;
    
    // Update user profile stats
    userProfile.totalIncorrect++;
    
    // Add XP for trying (less than correct)
    addXP(2);
    
    // Save changes
    saveFlashcards();
    saveUserProfile();
    
    // Move to next card
    currentCardIndex++;
    showCurrentCard();
}

// Skip the current card (don't change its box)
function skipCard() {
    if (currentCardIndex >= studySession.cardsToStudy.length) return;
    
    // Update study session stats
    studySession.skippedCount++;
    
    // Move to next card
    currentCardIndex++;
    showCurrentCard();
}

// Exit the study session without completing it
function exitStudySession() {
    if (confirm('Are you sure you want to exit this study session? Your progress will not be saved.')) {
        closeAllModals();
    }
}

// Show the study session completion screen
function showStudyComplete() {
    // Stop the timer
    clearInterval(studySession.timerInterval);
    
    // Calculate total study time
    studySession.endTime = new Date();
    studySession.totalTime = Math.floor((studySession.endTime - studySession.startTime) / 1000); // in seconds
    
    // Update user profile
    userProfile.totalStudyTime += studySession.totalTime;
    
    // Add XP for completing a study session
    const sessionXP = 20 + (5 * studySession.correctCount);
    addXP(sessionXP);
    
    // Add session to history
    const sessionData = {
        date: new Date().toISOString(),
        duration: studySession.totalTime,
        box: currentStudyBox,
        correct: studySession.correctCount,
        incorrect: studySession.incorrectCount,
        skipped: studySession.skippedCount
    };
    
    userProfile.studyHistory.push(sessionData);
    saveUserProfile();
    
    // Hide study container, show completion screen
    document.querySelector('.study-container').style.display = 'none';
    document.getElementById('study-complete').style.display = 'block';
    
    // Update results
    document.getElementById('correct-count').textContent = studySession.correctCount;
    document.getElementById('incorrect-count').textContent = studySession.incorrectCount;
    document.getElementById('skipped-count').textContent = studySession.skippedCount;
    
    // Format and display total study time
    const minutes = Math.floor(studySession.totalTime / 60);
    const seconds = studySession.totalTime % 60;
    document.getElementById('total-study-time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Generate completion message based on performance
    generateCompletionMessage();
}

// We've removed the completion message element to reduce scrolling
// This function is kept for reference but no longer used
function generateCompletionMessage() {
    // Function is no longer used since we removed the completion message element
    // to reduce scrolling and make the results more visible
    return;
}

// Finish the study session
function finishStudySession() {
    closeAllModals();
    updateUI();
    showNotification('Study session completed!');
}

// Try the study session again
function tryAgainStudySession() {
    // Restart the session with the same box
    startStudySession(currentStudyBox);
}

// Reset the study session
function resetStudySession() {
    currentStudyBox = null;
    currentCardIndex = 0;
    studySession = {
        correctCount: 0,
        incorrectCount: 0,
        cardsToStudy: []
    };
}

// Save flashcards to localStorage
function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

// Show a notification message
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s, transform 0.3s;
        z-index: 2000;
    }
    
    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Delete all data
function deleteAllData() {
    if (confirm('Are you sure you want to delete all flashcards and profile data? This action cannot be undone.')) {
        // Clear flashcards array
        flashcards = [];
        
        // Reset user profile
        userProfile = {
            username: '',
            totalCorrect: 0,
            totalIncorrect: 0,
            totalStudyTime: 0,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            dailyStudyGoal: 60 * 60,
            weeklyStudyGoal: 5 * 60 * 60,
            studyHistory: []
        };
        
        // Clear localStorage
        localStorage.removeItem('flashcards');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('darkMode');
        localStorage.removeItem('timerEnabled');
        localStorage.removeItem('maxCardTime');
        
        // Update UI
        updateUI();
        updateProfileUI();
        
        // Show notification
        showNotification('All data has been deleted successfully!');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update button icon and text
    if (isDarkMode) {
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// Check for dark mode preference
function checkDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
}

// Update profile UI elements
function updateProfileUI() {
    // Update user stats
    document.getElementById('user-level').textContent = userProfile.level;
    document.getElementById('level-display').textContent = userProfile.level;
    document.getElementById('current-xp').textContent = userProfile.xp;
    document.getElementById('xp-to-level').textContent = userProfile.xpToNextLevel;
    
    // Calculate XP progress percentage
    const xpProgressPercentage = (userProfile.xp / userProfile.xpToNextLevel) * 100;
    document.getElementById('xp-progress-fill').style.width = `${xpProgressPercentage}%`;
    
    // Calculate accuracy
    const totalAnswered = userProfile.totalCorrect + userProfile.totalIncorrect;
    const accuracy = totalAnswered > 0 ? Math.round((userProfile.totalCorrect / totalAnswered) * 100) : 0;
    document.getElementById('accuracy-stat').textContent = `${accuracy}%`;
    document.getElementById('accuracy-progress-fill').style.width = `${accuracy}%`;
    
    // Update total correct/incorrect
    document.getElementById('total-correct-stat').textContent = userProfile.totalCorrect;
    document.getElementById('total-incorrect-stat').textContent = userProfile.totalIncorrect;
    
    // Calculate mastered cards
    const masteredCards = flashcards.filter(card => card.box === 3 && isCardMastered(card)).length;
    document.getElementById('mastered-stat').textContent = masteredCards;
    
    // Determine rank based on level
    let rank = 'Beginner';
    if (userProfile.level >= 30) rank = 'Master';
    else if (userProfile.level >= 20) rank = 'Expert';
    else if (userProfile.level >= 15) rank = 'Advanced';
    else if (userProfile.level >= 10) rank = 'Intermediate';
    else if (userProfile.level >= 5) rank = 'Novice';
    document.getElementById('rank-badge').textContent = rank;
    
    // Format and display total study time
    const formattedTime = formatTime(userProfile.totalStudyTime);
    document.getElementById('total-study-time-stat').textContent = formattedTime;
    
    // Update study goal progress
    updateStudyGoals();
    
    // Update study history
    updateStudyHistory();
    
    // Set form values to current settings
    document.getElementById('default-timer-toggle').checked = studySession.timerEnabled;
    document.getElementById('card-time-input').value = studySession.maxCardTime;
    document.getElementById('username-input').value = userProfile.username;
    
    // Update goal input fields
    const dailyGoalHours = Math.floor(userProfile.dailyStudyGoal / 3600);
    const dailyGoalMinutes = Math.floor((userProfile.dailyStudyGoal % 3600) / 60);
    document.getElementById('daily-goal-hours').value = dailyGoalHours;
    document.getElementById('daily-goal-minutes').value = dailyGoalMinutes;
    document.getElementById('daily-goal-time').textContent = 
        `${dailyGoalHours.toString().padStart(2, '0')}:${dailyGoalMinutes.toString().padStart(2, '0')}`;
    
    const weeklyGoalHours = Math.floor(userProfile.weeklyStudyGoal / 3600);
    const weeklyGoalMinutes = Math.floor((userProfile.weeklyStudyGoal % 3600) / 60);
    document.getElementById('weekly-goal-hours').value = weeklyGoalHours;
    document.getElementById('weekly-goal-minutes').value = weeklyGoalMinutes;
    document.getElementById('weekly-goal-time').textContent = 
        `${weeklyGoalHours.toString().padStart(2, '0')}:${weeklyGoalMinutes.toString().padStart(2, '0')}`;
}

// Format time in HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update study goals progress
function updateStudyGoals() {
    // Get today's and weekly study time
    const todayStudyTime = getTodayStudyTime();
    const weeklyStudyTime = getWeeklyStudyTime();
    
    // Update daily goal
    updateCircularProgress('daily-progress-circle', 'daily-progress-text', todayStudyTime, userProfile.dailyStudyGoal);
    
    // Format daily time for display
    const dailyHours = Math.floor(todayStudyTime / 3600);
    const dailyMinutes = Math.floor((todayStudyTime % 3600) / 60);
    document.getElementById('current-daily-time').textContent = 
        `${dailyHours.toString().padStart(2, '0')}:${dailyMinutes.toString().padStart(2, '0')}`;
    
    // Update weekly goal
    updateCircularProgress('weekly-progress-circle', 'weekly-progress-text', weeklyStudyTime, userProfile.weeklyStudyGoal);
    
    // Format weekly time for display
    const weeklyHours = Math.floor(weeklyStudyTime / 3600);
    const weeklyMinutes = Math.floor((weeklyStudyTime % 3600) / 60);
    document.getElementById('current-weekly-time').textContent = 
        `${weeklyHours.toString().padStart(2, '0')}:${weeklyMinutes.toString().padStart(2, '0')}`;
}

// Update circular progress bar
function updateCircularProgress(circleId, textId, currentValue, maxValue) {
    const circle = document.getElementById(circleId);
    const text = document.getElementById(textId);
    
    // Calculate percentage (cap at 100%)
    const percentage = Math.min(100, Math.round((currentValue / maxValue) * 100));
    
    // The circumference of the circle
    const circumference = 2 * Math.PI * 45;
    
    // Calculate the dash offset
    const dashOffset = circumference - (percentage / 100) * circumference;
    
    // Update the circle and text
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = dashOffset;
    text.textContent = `${percentage}%`;
    
    // Change color based on percentage
    if (percentage >= 100) {
        circle.style.stroke = '#4cd137'; // Green when complete
    } else if (percentage >= 75) {
        circle.style.stroke = '#7d5fff'; // Purple when getting close
    } else if (percentage >= 50) {
        circle.style.stroke = '#fbc531'; // Yellow for halfway
    } else if (percentage >= 25) {
        circle.style.stroke = '#ff7f50'; // Orange for started
    } else {
        circle.style.stroke = '#6c5ce7'; // Default purple
    }
}

// Get study time for today
function getTodayStudyTime() {
    const today = new Date().toDateString();
    const todaySessions = userProfile.studyHistory.filter(session => 
        new Date(session.date).toDateString() === today);
    
    return todaySessions.reduce((total, session) => total + session.duration, 0);
}

// Get study time for current week
function getWeeklyStudyTime() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekSessions = userProfile.studyHistory.filter(session => 
        new Date(session.date) >= startOfWeek);
    
    return weekSessions.reduce((total, session) => total + session.duration, 0);
}

// Update study history display
function updateStudyHistory() {
    const historyList = document.getElementById('study-history-list');
    
    // Clear current list
    historyList.innerHTML = '';
    
    // If no history, show message
    if (userProfile.studyHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">No study sessions yet</div>';
        return;
    }
    
    // Sort history by date (most recent first)
    const sortedHistory = [...userProfile.studyHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date));
    
    // Show last 10 sessions
    const recentSessions = sortedHistory.slice(0, 10);
    
    // Create history items
    recentSessions.forEach(session => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Format date for display
        const sessionDate = new Date(session.date);
        const dateFormatted = sessionDate.toLocaleDateString();
        
        // Format duration for display
        const hours = Math.floor(session.duration / 3600);
        const minutes = Math.floor((session.duration % 3600) / 60);
        const durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div class="history-date">${dateFormatted}</div>
            <div class="history-duration">${durationFormatted}</div>
            <div class="history-stats">
                <span><i class="fas fa-check"></i> ${session.correct}</span>
                <span><i class="fas fa-times"></i> ${session.incorrect}</span>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Add XP and level up if necessary
function addXP(amount) {
    userProfile.xp += amount;
    
    // Check for level up
    if (userProfile.xp >= userProfile.xpToNextLevel) {
        userProfile.level++;
        userProfile.xp -= userProfile.xpToNextLevel;
        userProfile.xpToNextLevel = Math.floor(userProfile.xpToNextLevel * 1.5); // Increase XP needed for next level
        
        // Show level up notification
        showNotification(`Level Up! You are now level ${userProfile.level}!`);
    }
    
    // Save updated profile
    saveUserProfile();
    
    // Update UI if profile modal is open
    if (profileModal.style.display === 'flex') {
        updateProfileUI();
    }
}

// Set daily study goal
function setDailyStudyGoal() {
    const hours = parseInt(document.getElementById('daily-goal-hours').value) || 0;
    const minutes = parseInt(document.getElementById('daily-goal-minutes').value) || 0;
    
    // Calculate goal in seconds
    userProfile.dailyStudyGoal = (hours * 3600) + (minutes * 60);
    
    // Update the display
    document.getElementById('daily-goal-time').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Save the user profile
    saveUserProfile();
    
    // Update goal progress
    updateStudyGoals();
    
    // Hide settings
    document.getElementById('daily-goal-settings').style.display = 'none';
    
    // Show confirmation
    showNotification('Daily study goal updated!');
}

// Set weekly study goal
function setWeeklyStudyGoal() {
    const hours = parseInt(document.getElementById('weekly-goal-hours').value) || 0;
    const minutes = parseInt(document.getElementById('weekly-goal-minutes').value) || 0;
    
    // Calculate goal in seconds
    userProfile.weeklyStudyGoal = (hours * 3600) + (minutes * 60);
    
    // Update the display
    document.getElementById('weekly-goal-time').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Save the user profile
    saveUserProfile();
    
    // Update goal progress
    updateStudyGoals();
    
    // Hide settings
    document.getElementById('weekly-goal-settings').style.display = 'none';
    
    // Show confirmation
    showNotification('Weekly study goal updated!');
}

// Save username
function saveUsername() {
    const username = document.getElementById('username-input').value.trim();
    userProfile.username = username;
    saveUserProfile();
    updateWelcomeMessage();
    showNotification('Name saved!');
}

// Update timer setting
function updateTimerSetting() {
    studySession.timerEnabled = document.getElementById('default-timer-toggle').checked;
    localStorage.setItem('timerEnabled', studySession.timerEnabled);
    showNotification('Timer settings updated!');
}

// Update card time setting
function updateCardTime() {
    const cardTime = parseInt(document.getElementById('card-time-input').value);
    if (cardTime >= 5 && cardTime <= 120) {
        studySession.maxCardTime = cardTime;
        localStorage.setItem('maxCardTime', cardTime);
        showNotification('Card timer duration updated!');
    } else {
        showNotification('Please enter a value between 5 and 120 seconds.');
        document.getElementById('card-time-input').value = studySession.maxCardTime;
    }
}

// Save user profile to localStorage
function saveUserProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

// Export data to JSON file
function exportData() {
    const data = {
        flashcards,
        userProfile,
        settings: {
            timerEnabled: studySession.timerEnabled,
            maxCardTime: studySession.maxCardTime,
            darkMode: document.body.classList.contains('dark-mode')
        }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `leitner_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Data exported successfully!');
}

// Import data from JSON file
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the data has the expected structure
            if (data.flashcards && data.userProfile) {
                // Import flashcards
                flashcards = data.flashcards;
                localStorage.setItem('flashcards', JSON.stringify(flashcards));
                
                // Import user profile
                userProfile = data.userProfile;
                saveUserProfile();
                
                // Import settings if available
                if (data.settings) {
                    studySession.timerEnabled = data.settings.timerEnabled;
                    localStorage.setItem('timerEnabled', data.settings.timerEnabled);
                    
                    studySession.maxCardTime = data.settings.maxCardTime;
                    localStorage.setItem('maxCardTime', data.settings.maxCardTime);
                    
                    if (data.settings.darkMode) {
                        document.body.classList.add('dark-mode');
                    } else {
                        document.body.classList.remove('dark-mode');
                    }
                    localStorage.setItem('darkMode', data.settings.darkMode);
                }
                
                // Update UI
                updateUI();
                updateProfileUI();
                
                showNotification('Data imported successfully!');
            } else {
                showNotification('Error: Invalid data format');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing data. Please check the file format.');
        }
        
        // Reset the file input
        e.target.value = '';
    };
    
    reader.readAsText(file);
}

// Toggle goal settings visibility
function toggleSettingsVisibility(settingsId) {
    const settingsElement = document.getElementById(settingsId);
    if (settingsElement.style.display === 'block') {
        settingsElement.style.display = 'none';
    } else {
        settingsElement.style.display = 'block';
    }
}

// Update welcome message
function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (userProfile.username) {
        welcomeMessage.textContent = `Welcome back, ${userProfile.username}`;
        document.getElementById('welcome-banner').style.display = 'block';
    } else {
        document.getElementById('welcome-banner').style.display = 'none';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load settings from localStorage
    if (localStorage.getItem('timerEnabled') !== null) {
        studySession.timerEnabled = localStorage.getItem('timerEnabled') === 'true';
    }
    
    if (localStorage.getItem('maxCardTime') !== null) {
        studySession.maxCardTime = parseInt(localStorage.getItem('maxCardTime'));
    }
    
    init();
});