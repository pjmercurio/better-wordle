import React, { useEffect, useState, useCallback } from 'react';
import './Game.css';

const HIGH_SCORE_KEY = "worldle_high_score";
const yellowColor = '#B59F3B';
const greenColor = '#538D4E';
const rainbow = ['#D90000', '#D98200', '#FBFF00', '#04DB00', '#00C7D1', '#0047ED', '#B000D4', '#D40267'];
const usedLetters = new Set();

export default function Game() {
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [word, setWord] = useState('');
    const lastGuess = guesses[guesses.length - 1];
    const isSolved = word === lastGuess;
    const [startTime, setStartTime] = useState();
    const [didGiveUp, setDidGiveUp] = useState(false);

    // Handle word submission
    const submitWord = useCallback(() => {
        if (currentGuess.length !== word.length) return;
        if (!startTime) setStartTime(new Date());
        if (currentGuess === word) {
            const endTime = new Date();
            const timeElapsed = Math.round((endTime - startTime) / 1000) || 0; 
            const score = didGiveUp ? 0 : Math.max(word.length * (10 - guesses.length) + (150 - timeElapsed), 0);
            setHighScore(score);
            setTimeout(() => alert("You won! Only took you " + timeElapsed + " seconds! Your score was: " + score + "."), 1);
            setGuesses([...guesses, currentGuess]);
            return;
        }
        setGuesses([...guesses, currentGuess]);
        setCurrentGuess('');
    }, [currentGuess, guesses, word, startTime]);

    // Get the random word from the backend
    useEffect(() => {
        const animalURL = "https://random-word-form.herokuapp.com/random/animal";
        const randomURL = "https://random-word-api.herokuapp.com/word?number=1&swear=0"
        fetch(randomURL).then((res) => res.json()).then((data) => {
            const word = data[0].replaceAll(' ', '').replaceAll('-', '');
            setWord(word);
        })
        .catch((err) => console.log(err));
    }, []);

    // Set up key events
    useEffect(() => {
        const handleKeyPressed = ({ key }) => {
            if (key === 'Backspace' || key === 'Delete') {
                setCurrentGuess(currentGuess.slice(0, -1));
            }
            if (key === 'Enter') {
                submitWord();
            }
            if (key.length === 1 && (/[a-zA-Z]/).test(key) && currentGuess.length < word.length && !usedLetters.has(key)) {
                setCurrentGuess(currentGuess + key);
            }
        };

        window.addEventListener('keyup', handleKeyPressed);

        return () => {
            window.removeEventListener('keyup', handleKeyPressed);
        };
    }, [currentGuess, submitWord, word]);

    // Generate color coding for row of tiles
    const checkWord = useCallback((guess) => {
        var colors = Array(word.length).fill('clear');
        var greens = {};
        var yellows = {};
        guess.split('').forEach((letter, index) => {
            if (word.charAt(index) === letter) {
                greens[letter] = (greens[letter] || 0) + 1;
                colors[index] = greenColor;
            }
            else if (word.indexOf(letter) === -1) {
                usedLetters.add(letter);
            }
        });
        guess.split('').forEach((letter, index) => {
            const thisLetterGreenCount = greens[letter] || 0;
            const letterMatch = new RegExp(letter, 'g');
            const thisLetterYellowCount = (word.match(letterMatch) || []).length - thisLetterGreenCount;
            if (!thisLetterYellowCount) return;
            if (word.charAt(index) !== letter && word.indexOf(letter) !== -1 && (yellows[letter] || 0) < thisLetterYellowCount) {
                colors[index] = yellowColor;
                yellows[letter] = (yellows[letter] || 0) + 1;
            }
        });
        return colors;
    }, [word]);

    return (
        <div className="Game">
            {guesses.map((guess, index) => {
                const colors = checkWord(guess);
                return (
                    <GameRow>
                        {guess.split('').map((letter, index) => {
                            const tileColor = colors[index];
                            const color = (isSolved && guess === lastGuess && rainbow[index % rainbow.length]) || undefined;
                            return <Tile key={index} letter={letter} color={color} backgroundColor={tileColor} />
                        })}
                    </GameRow>
                )
}           )}
            {!isSolved &&
                <GameRow>
                    {currentGuess.split('').map((letter, index) =>
                        <Tile key={index} letter={letter} />
                    )}
                    {Array(word.length - currentGuess.length).fill(0).map((_, index) =>
                        <Tile key={index} />
                    )}
                </GameRow>
            }
            <LoserButton word={word} isSolved={isSolved} setDidGiveUp={setDidGiveUp}/>
            <HighScore />
        </div>
    );
}

function Tile({letter, backgroundColor, color}) {
    const border = (backgroundColor === 'clear' || backgroundColor === undefined) ? '2px solid gray' : 'none';
    return (
        <div className="Tile" style={{backgroundColor, color, border}}>
            {letter?.toUpperCase()}
        </div>
    )
}

function GameRow({children}) {
    return (
        <div className="GameRow">
            {children}
        </div>
    )
}

function LoserButton({word, isSolved, setDidGiveUp}) {
    return (
        <div className="LoserButton">
            <button onKeyDown={(evt) => evt.preventDefault()} onClick={() => showAlert(word, setDidGiveUp)} disabled={isSolved}>I Give Up!</button>
        </div>
    )
}

function HighScore() {
    const highScore = localStorage.getItem(HIGH_SCORE_KEY);
    return (
        <>
        {highScore &&
            <div className="HighScore">
                {"High Score: " + highScore}
            </div>
        }
        </>
    )
}

/* Utility functions */

function setHighScore(score) {
    const highScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;
    localStorage.setItem(HIGH_SCORE_KEY, Math.max(score, highScore));
}

function showAlert(word, setDidGiveUp) {
    const response = prompt(`Type: "I'm the biggest fucking loser on the planet" to continue...`);
    if (!response) return;
    if (response.toLowerCase().replaceAll("'", "") !== "im the biggest fucking loser on the planet" && response.toLowerCase() !== "mel is the biggest fucking loser on the planet") {
        alert("Nope, try again.");
        return;
    }
    setDidGiveUp(true);
    alert("The word was: " + word);
}