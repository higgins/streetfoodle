import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import Autosuggest from 'react-autosuggest';
import './App.css';
import data from './data.json'

const LOCAL_STORAGE_KEY = 'gameStats';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    width: '320px',
    height: '320px',
    transform: 'translate(-50%, -50%)',
    background: 'rgb(51,65,85)'
  },
};
Modal.setAppElement('#root');

function daysSinceEpoch() {
  const current_date = new Date();
  const epocDate = new Date(new Date().getTime() / 1000);
  const res = Math.abs(current_date - epocDate) / 1000;
  return Math.floor(res / 86400);
}

// Teach Autosuggest how to calculate suggestions for any given input value.
const getSuggestions = value => {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  return inputLength === 0 ? [] : data.filter(food =>
    food.name.toLowerCase().slice(0, inputLength) === inputValue
  ).slice(0,8);
};

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion.name;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => (
  <div>
    {suggestion.name}
  </div>
);

class SuggestInput extends React.Component {
  constructor(props) {
    super();

    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      suggestions: []
    };
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  render() {
    const { suggestions } = this.state;
    const { currentGuess } = this.props;
    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Name the street food',
      value: currentGuess,
      onChange: this.onChange
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}
function App() {
  const [currentGuess, setCurrentGuess] = useState('');
  const [numGuesses, setNumGuesses] = useState(3);
  const [showRegion, setShowRegion] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [previousGuesses, setPreviousGuesses] = useState([]);
  const [isLoser, setLoser] = useState(false);
  const [isWinner, setWinner] = useState(false);
  const [gameStats, setGameStats] = useState(null);
  const [thisGameState, setThisGameState] = useState(null);
  const [statsIsOpen, setStatsModal] = useState(false);
  const [infoIsOpen, setInfoModal] = useState(false);

  const today = daysSinceEpoch();
  const foodIndex = today % data.length;
  const food = data[foodIndex];

  useEffect(() => {
    if (!gameStats) {
      const stats = localStorage[LOCAL_STORAGE_KEY] ? JSON.parse(localStorage[LOCAL_STORAGE_KEY]) : {};
      if (stats.played) {
        setGameStats(stats);
        if (today === stats.lastPlayedDay) {
          setNumGuesses(numGuesses - stats.lastPlayedGuesses.length);
          setPreviousGuesses(stats.lastPlayedGuesses);
        }
      } else {
        setGameStats({ played: 0, won: 0, currentStreak: 0, maxStreak: 0, dist: [0,0,0], lastPlayedDay: null, lastPlayedGuesses: [] });
      }
    }
  }, [gameStats])

  function openStatsModal() {
    setStatsModal(true);
  }

  function closeStatsModal() {
    setStatsModal(false);
  }

  function openInfoModal() {
    setInfoModal(true);
  }

  function closeInfoModal() {
    setInfoModal(false);
  }

  const regionClasses = showRegion ? "region self-start" : "hidden";
  const descriptionClasses = showDescription ? "max-w-xs self-start leading-5" : "hidden";
  const guess1Classes = numGuesses === 3 ? "rounded bg-slate-800 p-2 m-1" : "rounded bg-red-600 p-2 m-1";
  const guess2Classes = numGuesses === 2 ? "rounded bg-slate-800 p-2 m-1" : ( numGuesses === 3 ? "rounded bg-slate-600 p-2 m-1" : "rounded bg-red-600 p-2 m-1" );
  const guess3Classes = numGuesses === 1 ? "rounded bg-slate-800 p-2 m-1" : ( numGuesses >= 2 ? "rounded bg-slate-600 p-2 m-1" : "rounded bg-red-600 p-2 m-1" );

  const updateStats = (wonGame, numGuesses) => {
    const played = gameStats.played + 1;
    const won = wonGame ? gameStats.won + 1 : gameStats.won;
    const currentStreak = gameStats.lastPlayedDay ? (gameStats.lastPlayedDay + 1 === today ? gameStats.currentStreak + 1 : (wonGame ? 1 : 0)) : 1;
    const maxStreak = gameStats.maxStreak > currentStreak ? gameStats.maxStreak : currentStreak;
    const newDist = [...gameStats.dist];
    if (wonGame) {
      const guessIndex = Math.abs(numGuesses - 3);
      newDist[guessIndex] = gameStats.dist[guessIndex] + 1;
    }
    const updatedStats = {
      played,
      won,
      currentStreak,
      maxStreak,
      dist: newDist,
      lastPlayedDay: today
    };
    setGameStats(updatedStats);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(updatedStats);
  }

  const onGuess = () => {
    if (!currentGuess.length) {
      return
    }
    // FIXME:
    // updateBoard()
      // update state
      // update localStorage state
    if (food.name === currentGuess) { // NOTE: correct guess
      setShowRegion()
      setShowDescription()
      setWinner(true);
      setThisGameState(numGuesses);
      updateStats(true, numGuesses);
      return
    }
    setPreviousGuesses([...previousGuesses, currentGuess])
    setNumGuesses(numGuesses - 1);
    setCurrentGuess('');
    if (numGuesses <= 1) {
      setNumGuesses(0);
      setLoser(true);
      setThisGameState(0);
      updateStats(false,4);
      return
    }
    if (numGuesses === 2) {
      setShowDescription(true)
    }
    if (numGuesses === 3) {
      setShowRegion(true)
    }
  }
  const onShareResults = () => {
    let emoji;
    if (thisGameState === 3) {
      emoji = '🍏🍍🍍';
    } else if (thisGameState === 2) {
      emoji = '🍎🍏🍍';
    } else if (thisGameState === 1) {
      emoji = '🍎🍎🍏';
    } else {
      emoji = '🍎🍎🍎'
    }
    const clipBoard = `Street Foodle #FIXME\n${emoji}\n\nhttps://encapsulate.me/foodle`;
    navigator.clipboard.writeText(clipBoard);
  }
  const buttonText = numGuesses > 0 ? "SUBMIT" : "SHARE";
  const previousGuessesDiv = previousGuesses.length ? previousGuesses.map((guess) => (<div className="self-start">{`❌ ${guess}`}</div>)) : null;
  return (
    <div className="h-screen w-screen bg-slate-900 text-white font-medium text-lg">
      <div className="container mx-auto max-w-xs px-2.5">
        <header className="flex flex-row justify-between items-center text-2xl">
          <div>
            <span id="logo" className="mx-1">StreetFoodle</span>
          </div>
          <div>
            <span onClick={openStatsModal}><i className="fas fa-chart-simple mx-1"></i></span>
            <span onClick={openInfoModal}><i className="far fa-question-circle mx-1"></i></span>
          </div>
        </header>
        <div className="flex flex-col items-center">
          <img src={food.imageURL} />
          { isWinner && <div>You got it! That is "{food.name}"</div> }
          { isLoser && <div>The answer was: "{food.name}"</div> }
          <div className="flex flex-row">
            <div className={guess1Classes}>1</div>
            <div className={guess2Classes}>2</div>
            <div className={guess3Classes}>3</div>
          </div>
          <div className={regionClasses}><strong>Hint 1:</strong> {food.region}</div>
          <div className={descriptionClasses}><strong>Hint 2:</strong> {food.description}</div>
          {
            !isWinner && !isLoser && numGuesses > 0 &&
            <div className="flex flex-row justify-center items-center my-2">
              <SuggestInput currentGuess={currentGuess} onChange={setCurrentGuess} />
              <button className="ml-2 p-2 bg-slate-500 rounded-md hover:bg-slate-600 text-white" onClick={onGuess}>{buttonText}</button>
            </div>
          }
          {
            (isWinner || isLoser) &&
            <div className="flex flex-row justify-center items-center my-2">
              <button className="ml-2 p-2 bg-emerald-500 rounded-md hover:bg-emerald-600 text-white" onClick={onShareResults}>SHARE</button>
            </div>
          }
          { previousGuessesDiv }
        </div>
      </div>
      <Modal
        isOpen={statsIsOpen}
        onRequestClose={closeStatsModal}
        style={customStyles}
      >
        <div className="text-white bg-slate-700">
          <div className="flex flex-row justify-between">
            <div className="text-xl font-bold">STATS</div>
            <button onClick={closeStatsModal}><i class="fa-solid fa-xmark"></i></button>
          </div>
          { gameStats &&
            <>
              <div className="flex flex-row justify-between my-2">
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{gameStats.played}</div>
                  <div className="text-sm">Played</div>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{gameStats.won}</div>
                  <div className="text-sm">Won</div>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{gameStats.played ? Math.round((gameStats.won / gameStats.played) * 100) : 0}</div>
                  <div className="text-sm">Win %</div>
                </div>
              </div>

              <div className="font-medium leading-5 my-1"><strong>Current Streak: {gameStats.currentStreak}</strong></div>
              <div className="font-medium leading-5 my-1"><strong>Max Streak: {gameStats.maxStreak}</strong></div>
              <div className="flex flex-row justify-between my-2">
                <div className="text-xl font-bold">GUESS DISTRIBUTION</div>
              </div>
              <div className="font-medium leading-5 my-1"><strong>First guess: {gameStats.dist[0]}</strong></div>
              <div className="font-medium leading-5 my-1"><strong>Second guess: {gameStats.dist[1]}</strong></div>
              <div className="font-medium leading-5 my-1"><strong>Third guess: {gameStats.dist[2]}</strong></div>
            </>
          }
        </div>
      </Modal>
      <Modal
        isOpen={infoIsOpen}
        onRequestClose={closeInfoModal}
        style={customStyles}
      >
        <div className="text-white bg-slate-700">
          <div className="flex flex-row justify-between">
            <div className="text-xl font-bold">ABOUT</div>
            <button onClick={closeInfoModal}><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div className="font-medium leading-5 my-2"><em>Street Foodle</em> is an idea by mi suegra (mother-in-law) Maria Eugenia Navarro.</div>
          <div className="font-medium leading-5 my-2"><strong>The rules:</strong> guess the name of a dish from around the world in less than 3 attempts. New dish every day.</div>
          <div className="font-medium leading-5 my-2">All dishes are sourced from Wikipedia's <a className="text-sky-400 font-bold" target="_blank" href="https://en.wikipedia.org/wiki/List_of_street_foods"><em>List of street foods</em> article.</a></div>
          <div className="font-medium leading-5 my-2">If you like this, <a className="text-sky-400 font-bold" target="_blank" href="https://twitter.com/justinprojects">let me know!</a> 🌮</div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
