 
let filteredQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 10;
let answeredQuestions = [];
let quizDifficulty = 'easy';
let quizCategoryName = '';

const quizScreen = document.getElementById('quiz-screen');
const startScreen = document.getElementById('start-screen');
const loadingScreen = document.getElementById('loading-screen');
const endScreen = document.getElementById('end-screen');
const optionsContainer = document.getElementById('options-container');
const questionText = document.getElementById('question-text');
const scoreCounter = document.getElementById('score-counter');
const questionIndexDisplay = document.getElementById('question-index');
const nextButton = document.getElementById('next-button');
const skipButton = document.getElementById('skip-button');
const timerBar = document.getElementById('timer-bar');
const leaderboardModal = document.getElementById('leaderboard-modal');
const reviewContainer = document.getElementById('review-container');
const categorySelect = document.getElementById('quiz-category-select');
const errorModal = document.getElementById('error-modal');
const errorModalMessage = document.getElementById('error-modal-message');

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showErrorMessage(message) {
    errorModalMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function hideErrorModal() {
    errorModal.style.display = 'none';
    showScreen('start-screen');
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

async function fetchQuestions(difficulty) {
    showScreen('loading-screen');
    const categoryId = categorySelect.value;
    quizCategoryName = categorySelect.options[categorySelect.selectedIndex].text;
    
    const apiUrl = `https://opentdb.com/api.php?amount=5&category=${categoryId}&difficulty=${difficulty}&type=multiple`;

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    const initialDelay = 1000;

    while (attempts < maxAttempts) {
        try {
            response = await fetch(apiUrl);

            if (!response.ok) {
                if (response.status === 429 && attempts < maxAttempts - 1) {
                    const delay = initialDelay * Math.pow(2, attempts);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempts++;
                    continue;
                }
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.response_code !== 0) {
                if (result.response_code === 1) {
                    showErrorMessage('Not enough questions available for that category and difficulty. Try a different selection.');
                } else {
                    showErrorMessage(`OpenTDB Error: Code ${result.response_code}.`);
                }
                return [];
            }
            
            const transformedQuestions = result.results.map(q => {
                const incorrectOptions = q.incorrect_answers.map(decodeHtml);
                const correctAnswer = decodeHtml(q.correct_answer);
                const allOptions = [...incorrectOptions, correctAnswer];
                shuffle(allOptions);
                
                return {
                    question: decodeHtml(q.question),
                    options: allOptions,
                    answer: correctAnswer,
                };
            });

            return transformedQuestions;

        } catch (error) {
            console.error(error);
            showErrorMessage('Failed to connect to the quiz API. Please check your network and try again.');
        }
        attempts++;
    }

    return [];
}

async function startQuiz(difficulty) {
    quizDifficulty = difficulty;
    
    const questions = await fetchQuestions(difficulty);
    
    if (questions.length === 0) {
        return;
    }
    
    filteredQuestions = questions;
    currentQuestionIndex = 0;
    score = 0;
    answeredQuestions = [];
    scoreCounter.textContent = 'Score: 0';
    showScreen('quiz-screen');
    loadQuestion();
}

function startTimer() {
    stopTimer();
    timeLeft = 10;
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#48bb78';
    
    timer = setInterval(() => {
        timeLeft--;
        const percentage = (timeLeft / 10) * 100;
        timerBar.style.width = percentage + '%';

        if (timeLeft <= 5) {
            timerBar.style.backgroundColor = '#f6ad55';
        }
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleAnswer(null);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

function loadQuestion() {
    stopTimer();
    if (currentQuestionIndex >= filteredQuestions.length) {
        endQuiz();
        return;
    }

    const currentQuestion = filteredQuestions[currentQuestionIndex];
    questionIndexDisplay.textContent = `Question ${currentQuestionIndex + 1}/${filteredQuestions.length}`;
    questionText.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';
    
    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'button option-button';
        button.textContent = option;
        button.onclick = () => handleAnswer(option, button);
        optionsContainer.appendChild(button);
    });

    nextButton.disabled = true;
    nextButton.style.backgroundColor = '#a0aec0';
    skipButton.disabled = false;
    startTimer();
}

function handleAnswer(selectedOption, clickedButton) {
    stopTimer();
    nextButton.disabled = false;
    nextButton.style.backgroundColor = '#48bb78';
    skipButton.disabled = true;
    
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    const buttons = optionsContainer.querySelectorAll('.option-button');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === currentQuestion.answer) {
            button.classList.add('correct');
        } else if (button === clickedButton && !isCorrect) {
            button.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        score++;
        scoreCounter.textContent = `Score: ${score}`;
    }

    answeredQuestions.push({
        question: currentQuestion.question,
        userAnswer: selectedOption || 'Skipped (No Answer)',
        correctAnswer: currentQuestion.answer,
        wasCorrect: isCorrect
    });
}

function nextQuestion(skipped) {
    if (skipped) {
        handleAnswer(null);
    }
    currentQuestionIndex++;
    loadQuestion();
}

function endQuiz() {
    stopTimer();
    showScreen('end-screen');
    
    const totalQuestions = filteredQuestions.length;
    const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(0) : 0;

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-percentage').textContent = `${percentage}%`;

    renderReview();
}

function renderReview() {
    reviewContainer.innerHTML = '<h3>Review Answers:</h3>';
    answeredQuestions.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <p class="review-question">Q${index + 1}: ${item.question}</p>
            <p style="margin: 0; font-size: 0.9rem;">
                Your Answer: <span class="${item.wasCorrect ? 'review-answer-correct' : 'review-answer-incorrect'}">
                    ${item.userAnswer}
                </span>
                ${!item.wasCorrect && item.userAnswer !== 'Skipped (No Answer)' ? 
                    `<span style="margin-left: 10px; color: #4a5568;"> | Correct: ${item.correctAnswer}</span>` 
                    : item.userAnswer === 'Skipped (No Answer)' ? 
                    `<span style="margin-left: 10px; color: #4a5568;"> | Correct: ${item.correctAnswer}</span>` 
                    : ''}
            </p>
        `;
        reviewContainer.appendChild(div);
    });
}

function getLeaderboard() {
    const leaderboard = localStorage.getItem('quizLeaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

function saveScoreAndShowLeaderboard() {
    const nameInput = document.getElementById('player-name-input');
    let playerName = nameInput.value.trim();
    if (playerName === '') {
        playerName = 'Anonymous';
    }

    const totalQuestions = filteredQuestions.length;
    const percentage = totalQuestions > 0 ? parseFloat(((score / totalQuestions) * 100).toFixed(2)) : 0;
    
    const newEntry = {
        name: playerName,
        score: score,
        percentage: percentage,
        difficulty: quizDifficulty,
        topic: quizCategoryName,
        date: new Date().toLocaleDateString()
    };
    
    let leaderboard = getLeaderboard();
    leaderboard.push(newEntry);
    
    leaderboard.sort((a, b) => b.score - a.score || b.percentage - a.percentage);
    
    localStorage.setItem('quizLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
    nameInput.value = '';

    showLeaderboard();
}

function renderLeaderboard() {
    const leaderboard = getLeaderboard();
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    if (leaderboard.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #4a5568;">No scores yet.</p>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span style="font-weight: bold; color: #4a90e2;">#${index + 1}</span>
            <span>${entry.name} (${entry.difficulty}, ${entry.topic})</span>
            <span style="font-weight: bold;">${entry.score} <span style="font-weight: normal; color: #718096;">(${entry.percentage}%)</span></span>
        `;
        list.appendChild(item);
    });
}

function showLeaderboard() {
    renderLeaderboard();
    leaderboardModal.style.display = 'flex';
}

function hideLeaderboard() {
    leaderboardModal.style.display = 'none';
}

window.onload = () => {
    showScreen('start-screen');
};
    