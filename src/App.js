import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import Autosuggest from 'react-autosuggest';
import './App.css';
import FOOD_DATA from './data.json'

const LOCAL_STORAGE_KEY = 'streetfoodle';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    width: '320px',
    height: '380px',
    transform: 'translate(-50%, -50%)',
    background: 'rgb(51,65,85)'
  },
};
Modal.setAppElement('#root');

function daysSinceEpoch(d) {
  const current_date = d ? new Date(d) : new Date();
  const epocDate = new Date(new Date().getTime() / 1000);
  const res = Math.abs(current_date - epocDate) / 1000;
  return Math.floor(res / 86400);
}

const LAUNCH_DATE = daysSinceEpoch('06/25/2022');

// Teach Autosuggest how to calculate suggestions for any given input value.
const getSuggestions = value => {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  return inputLength === 0 ? [] : FOOD_DATA.filter(f =>
    f.name.toLowerCase().slice(0, inputLength) === inputValue
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

//{
//  currentGame: 0,
//  games: {
//    0: {
//      guesses: ['Hot Dog', 'Hamburger'],
//      answer: 'blah',
//    }
//  }
//}
const DEFAULT_STATE = {
  currentGame: null,
  games: {}
}
function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [currentGuess, setCurrentGuess] = useState('');
  const [statsIsOpen, setStatsModal] = useState(false);
  const [infoIsOpen, setInfoModal] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const daysSinceLaunch = daysSinceEpoch() - LAUNCH_DATE;
  const currentGameIndex = daysSinceLaunch % FOOD_DATA.length;
  const todaysFood = FOOD_DATA[currentGameIndex];
  const openModal = (modalType) => () => modalType == 'stats' ? setStatsModal(true) : setInfoModal(true);
  const closeModal = (modalType) => () => modalType == 'stats' ? setStatsModal(false) : setInfoModal(false);

  useEffect(() => {
    if (!state.currentGame) {
      const cachedState = localStorage[LOCAL_STORAGE_KEY] ? JSON.parse(localStorage[LOCAL_STORAGE_KEY]) : null;
      if (cachedState) {
        const hydratedGames = cachedState.games;
        if (!hydratedGames[currentGameIndex]) {
          hydratedGames[currentGameIndex] = {
            guesses: [],
            answer: todaysFood.name,
          };
        }
        setState({
          currentGame: currentGameIndex,
          games: hydratedGames,
        });
      } else {
        setState({
          currentGame: currentGameIndex,
          games: {
            [currentGameIndex]: {
              guesses: [],
              answer: todaysFood.name,
            }
          }
        });
      }
    }
  }, [state]);

  if (!state.currentGame) {
    return null;
  }
  const currentGame = state.games[state.currentGame];
  const previousGuesses = currentGame.guesses;
  const guessesRemaining = 3 - previousGuesses.length;
  const isWinner = currentGame.guesses[currentGame.guesses.length - 1] === todaysFood.name;
  const isLoser = guessesRemaining <= 0 ? currentGame.guesses[currentGame.guesses.length - 1] !== todaysFood.name : false;
  const regionClasses = guessesRemaining <= 2 ? "region self-start" : "hidden";
  const descriptionClasses = guessesRemaining <= 1 ? "max-w-xs self-start leading-5" : "hidden";

  let guess1Classes = guessesRemaining < 3 ?  "rounded bg-red-600 p-2 m-1" : "rounded bg-slate-800 p-2 m-1";
  let guess2Classes = guessesRemaining < 2 ?  "rounded bg-red-600 p-2 m-1" : "rounded bg-slate-800 p-2 m-1";
  let guess3Classes = guessesRemaining < 1 ?  "rounded bg-red-600 p-2 m-1" : "rounded bg-slate-800 p-2 m-1";

  if (isWinner) {
    if (guessesRemaining === 2) {
      guess1Classes = "rounded bg-lime-600 p-2 m-1";
    } else if (guessesRemaining === 1) {
      guess1Classes = "rounded bg-red-600 p-2 m-1";
      guess2Classes = "rounded bg-lime-600 p-2 m-1";
    } else {
      guess1Classes = "rounded bg-red-600 p-2 m-1";
      guess2Classes = "rounded bg-red-600 p-2 m-1";
      guess3Classes = "rounded bg-lime-600 p-2 m-1";
    }
  } else if (isLoser) {
    guess1Classes = "rounded bg-red-600 p-2 m-1";
    guess2Classes = "rounded bg-red-600 p-2 m-1";
    guess3Classes = "rounded bg-red-600 p-2 m-1";
  }
  const numGamesPlayed = Object.values(state.games).filter((g) => (g.guesses.length === 3 || !!g.guesses.find(e => e === g.answer))).length;
  const numGamesWon = Object.values(state.games).filter((g) => !!g.guesses.find(e => e === g.answer)).length;
  const percentGamesWon = numGamesPlayed ? Math.round((numGamesWon / numGamesPlayed) * 100) : 0;
  const numFirstGuess = Object.values(state.games).filter((g) => g.answer === g.guesses[0]).length
  const numSecondGuess = Object.values(state.games).filter((g) => g.answer === g.guesses[1]).length
  const numThirdGuess = Object.values(state.games).filter((g) => g.answer === g.guesses[2]).length

  // NOTE: write to localStorage and component state
  const saveState = (newState) => {
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(newState);
    setState(newState);
  }

  const onGuess = () => {
    if (!currentGuess.length) {
      return
    }
    const updatedGames = state.games;
    updatedGames[state.currentGame].guesses.push(currentGuess);
    const newState = { ...state, games: updatedGames };
    saveState(newState);
    setCurrentGuess('');
  }

  const onShareResults = () => {
    let emoji;
    const updatedGames = state.games;
    const attempts = state.games[state.currentGame].guesses.length;

    if (attempts === 1) {
      emoji = '🍏🍍🍍';
    } else if (attempts === 2) {
      emoji = '🍎🍏🍍';
    } else {
      emoji = isWinner ? '🍎🍎🍏' : '🍎🍎🍎';
    }
    const clipBoard = `Street Foodle #${currentGameIndex + 1}\n${emoji}\n\nhttps://encapsulate.me/streetfoodle`;
    navigator.clipboard.writeText(clipBoard);
    setShowCopied(true);
    setTimeout(() => {
      setShowCopied(false);
    }, 5000);
  }
  let buttonText = "SUBMIT";
  if (isWinner || isLoser) {
    buttonText = showCopied ? "COPIED" : "SHARE";
  }
  const previousGuessesDiv = previousGuesses.length ? previousGuesses.map((guess) => {
    return guess === todaysFood.name ? <div className="self-start">{`✅ ${guess}`}</div> : <div className="self-start">{`❌ ${guess}`}</div>;
  }) : null;
  return (
    <div className="h-screen w-screen bg-slate-900 text-white font-medium text-lg">
      <div className="container mx-auto max-w-xs px-2.5">
        <header className="flex flex-row justify-between items-center text-2xl">
          <div>
            <span id="logo" className="mx-1">StreetFoodle</span>
          </div>
          <div>
            <span onClick={openModal('stats')}><i className="fas fa-chart-simple mx-1"></i></span>
            <span onClick={openModal('info')}><i className="far fa-question-circle mx-1"></i></span>
          </div>
        </header>
        <div className="flex flex-col items-center">
          <img src={todaysFood.imageURL} />
          { isWinner && <div>You got it! That is "{todaysFood.name}"</div> }
          { isLoser && <div>The answer was: "{todaysFood.name}"</div> }
          <div className="flex flex-row">
            <div className={guess1Classes}>1</div>
            <div className={guess2Classes}>2</div>
            <div className={guess3Classes}>3</div>
          </div>
          <div className={regionClasses}><strong>Hint 1:</strong> {todaysFood.region}</div>
          <div className={descriptionClasses}><strong>Hint 2:</strong> {todaysFood.description}</div>
          {
            !isWinner && !isLoser && guessesRemaining > 0 &&
            <div className="flex flex-row justify-center items-center my-2">
              <SuggestInput currentGuess={currentGuess} onChange={setCurrentGuess} />
              <button className="ml-2 p-2 bg-slate-500 rounded-md hover:bg-slate-600 text-white" onClick={onGuess}>{buttonText}</button>
            </div>
          }
          {
            (isWinner || isLoser) &&
            <div className="flex flex-row justify-center items-center my-2">
              <button className="ml-2 p-2 bg-emerald-500 rounded-md hover:bg-emerald-600 text-white" onClick={onShareResults}>{buttonText}</button>
            </div>
          }
          { previousGuessesDiv }
        </div>
        <div className="flex flex-col items-center">
          <div className="relative bottom-4 mt-5">Made with <span>🌮</span> by <a className="text-sky-400 font-bold" target="_blank" href="https://twitter.com/justinprojects">Justin Higgins</a></div>
        </div>
      </div>
      <Modal
        isOpen={statsIsOpen}
        onRequestClose={closeModal('stats')}
        style={customStyles}
      >
        <div className="text-white bg-slate-700">
          <div className="flex flex-row justify-between">
            <div className="text-xl font-bold">STATS</div>
            <button onClick={closeModal('stats')}><i class="fa-solid fa-xmark"></i></button>
          </div>
          { state &&
            <>
              <div className="flex flex-row justify-between my-2">
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{numGamesPlayed}</div>
                  <div className="text-sm">Played</div>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{numGamesWon}</div>
                  <div className="text-sm">Won</div>
                </div>
                <div className="flex flex-col justify-center items-center">
                  <div className="font-medium text-xl">{percentGamesWon}</div>
                  <div className="text-sm">Win %</div>
                </div>
              </div>
              <div className="flex flex-row justify-between my-2">
                <div className="text-xl font-bold">GUESS DISTRIBUTION</div>
              </div>
              <div className="font-medium leading-5 my-1"><strong>First guess: {numFirstGuess}</strong></div>
              <div className="font-medium leading-5 my-1"><strong>Second guess: {numSecondGuess}</strong></div>
              <div className="font-medium leading-5 my-1"><strong>Third guess: {numThirdGuess}</strong></div>
            </>
          }
        </div>
      </Modal>
      <Modal
        isOpen={infoIsOpen}
        onRequestClose={closeModal('info')}
        style={customStyles}
      >
        <div className="text-white bg-slate-700">
          <div className="flex flex-row justify-between">
            <div className="text-xl font-bold">ABOUT</div>
            <button onClick={closeModal('info')}><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div className="font-medium leading-5 my-2"><em>Street Foodle</em> is an idea by mi suegra (mother-in-law) <a className="text-sky-400 font-bold" target="_blank" href="https://www.instagram.com/marunavarro58">Maria Eugenia Navarro.</a></div>
          <div className="font-medium leading-5 my-2"><strong>The rules:</strong> guess the name of a dish from around the world in less than 3 attempts. New dish every day.</div>
          <div className="font-medium leading-5 my-2">All dishes are sourced from Wikipedia's <a className="text-sky-400 font-bold" target="_blank" href="https://en.wikipedia.org/wiki/List_of_street_foods"><em>List of street foods</em> article.</a> You can add food suggestions <a className="text-sky-400 font-bold" target="_blank" href="https://github.com/higgins/streetfoodle">here</a></div>
          <div className="font-medium leading-5 my-2">If you like this, <a className="text-sky-400 font-bold" target="_blank" href="https://twitter.com/justinprojects">let me know</a> or add something creative to my art project: <a className="text-sky-400 font-bold" target="_blank" href="https://24HourHomepage.com">24HourHomepage</a>  🌮</div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
