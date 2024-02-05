document.addEventListener('DOMContentLoaded', () => {
    const QUESTIONCONTAINER = document.getElementById('question');
    const ANSWERCONTAINER = document.getElementById('answers');
    const RESULTCONTAINER = document.getElementById('result');
    const PROGRESSCONTAINER = document.getElementById('progress');
    const CURRENTSCOREDISPLAY = document.getElementById('currentScore');
    const HIGHSCOREDISPLAY = document.getElementById('highScore');
    const GAMESETUPDIV = document.getElementById('game-setup');
    const QUIZDIV = document.getElementById('quiz');
    const CATEGORYSELECT = document.getElementById('category');
    const AMOUNTINPUT = document.getElementById('amount');
    const DIFFICULTYSELECT = document.getElementById('difficulty');
    const TYPESELECT = document.getElementById('type');
    const STARTBUTTON = document.getElementById('start-btn');

    let currentQuestions = [];
    let score = 0;
    let questionIndex = 0;
    let highScore = parseInt(localStorage.getItem('HighScoreTrivia')) || 0;
    let questionStartTime;
    const BASESCOREPERQUESTION = 1000;
    const PENALTYPERSECOND = 10;

    HIGHSCOREDISPLAY.innerText = `High Score: ${highScore}`;

    function fetchCategories() {
        fetch('https://opentdb.com/api_category.php').then(response => response.json()).then(data => {
            data.trivia_categories.forEach(category => {
                const OPTION = document.createElement('option');
                OPTION.value = category.id;
                OPTION.textContent = category.name;
                CATEGORYSELECT.appendChild(OPTION);
            });
        });
    }

    function startGame() {
        const CATEGORY = CATEGORYSELECT.value;
        const AMOUNT = AMOUNTINPUT.value;
        const DIFFICULTY = DIFFICULTYSELECT.value;
        const TYPE = TYPESELECT.value;
        fetchQuestions(AMOUNT, CATEGORY, DIFFICULTY, TYPE);
        GAMESETUPDIV.style.display = 'none';
        QUIZDIV.style.display = 'block';
    }

    function fetchQuestions(amount, category, difficulty, type) {
        let url = `https://opentdb.com/api.php?amount=${amount}`;
        if (category) url += `&category=${category}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        if (type) url += `&type=${type}`;

        fetch(url).then(response => response.json()).then(data => {
            currentQuestions = data.results;
            questionIndex = 0;
            score = 0;
            displayQuestion();
        }).catch(error => alert('Error:' + error));
    }

    function displayQuestion() {
        if (questionIndex < currentQuestions.length) {
            let currentQuestion = currentQuestions[questionIndex];
            QUESTIONCONTAINER.innerHTML = decodeHTML(currentQuestion.question);
            displayAnswers(currentQuestion);
            updateProgress();
            questionStartTime = Date.now();
        } else {
            updateHighScore();
            showResults();
        }
    }

    function displayAnswers(question) {
        ANSWERCONTAINER.innerHTML = '';
        const ANSWERS = [...question.incorrect_answers, question.correct_answer];
        shuffleArray(ANSWERS);

        ANSWERS.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = decodeHTML(answer);
            button.className = 'answer-btn';
            button.addEventListener('click', () => selectAnswer(button, question.correct_answer, ANSWERS));
            ANSWERCONTAINER.appendChild(button);
        });
    }

    function selectAnswer(selectedButton, correctAnswer, answers) {
        const TIMETAKEN = (Date.now() - questionStartTime) / 1000;
        let scoreForThisQuestion = Math.max(BASESCOREPERQUESTION - Math.floor(TIMETAKEN) * PENALTYPERSECOND, 0);

        disableButtons();
        let correctButton;
        answers.forEach(answer => {
            if (decodeHTML(answer) === decodeHTML(correctAnswer)) {
                correctButton = [...ANSWERCONTAINER.childNodes].find(button => button.innerHTML === decodeHTML(correctAnswer));
            }
        });

        if (decodeHTML(selectedButton.innerHTML) === decodeHTML(correctAnswer)) {
            score += scoreForThisQuestion;
            selectedButton.classList.add('correct');
            RESULTCONTAINER.innerText = `Correct! + ${scoreForThisQuestion} Points`;
        } else {
            selectedButton.classList.add('incorrect');
            correctButton.classList.add('correct');
            RESULTCONTAINER.innerText = `Wrong! The correct answer was: ${decodeHTML(correctAnswer)}`;
        }

        updateCurrentScore();
        setTimeout(() => {
            questionIndex++;
            displayQuestion();
            RESULTCONTAINER.innerText = '';
        }, 3000);
    }

    function updateCurrentScore() {
        CURRENTSCOREDISPLAY.innerText = `Current Score: ${score}`;
    }

    function disableButtons() {
        const BUTTONS = ANSWERCONTAINER.getElementsByClassName('answer-btn');
        for (let button of BUTTONS) {
            button.disabled = true;
        }
    }

    function showResults() {
        QUESTIONCONTAINER.innerText = 'Quiz Finished!';
        ANSWERCONTAINER.innerHTML = '';
        RESULTCONTAINER.innerText = `Your final score is ${score}`;
        updateHIGHSCOREDISPLAY();
        PROGRESSCONTAINER.innerText = '';
        const RESTARTBUTTON = document.createElement('button');
        RESTARTBUTTON.textContent = 'Restart Quiz';
        RESTARTBUTTON.addEventListener('click', () => {
            QUIZDIV.style.display = 'none';
            GAMESETUPDIV.style.display = 'block';
            fetchCategories();
        });
        ANSWERCONTAINER.appendChild(RESTARTBUTTON);
    }

    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('HighScoreTrivia', highScore.toString());
            updateHIGHSCOREDISPLAY();
        }
    }

    function updateHIGHSCOREDISPLAY() {
        HIGHSCOREDISPLAY.innerText = `High Score: ${highScore}`;
    }

    function updateProgress() {
        PROGRESSCONTAINER.innerText = `Question ${questionIndex + 1}/${currentQuestions.length}`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const J = Math.floor(Math.random() * (i + 1));
            [array[i], array[J]] = [array[J], array[i]];
        }
    }

    function decodeHTML(html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    STARTBUTTON.addEventListener('click', startGame);

    fetchCategories();

});