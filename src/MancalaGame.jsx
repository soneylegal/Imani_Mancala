import React, { useEffect, useMemo, useState } from 'react';
import './MancalaGame.css';

const INITIAL_BOARD = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];

const MancalaGame = () => {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [started, setStarted] = useState(false);
  const [playerNames, setPlayerNames] = useState({ player1: 'Jogador 1', player2: 'Jogador 2' });
  const [playerInputs, setPlayerInputs] = useState({ player1: '', player2: '' });
  const [infoMessage, setInfoMessage] = useState('Insira os nomes e comece a partida.');
  const [lastMove, setLastMove] = useState({ index: null, capture: false, extraTurn: false });

  useEffect(() => {
    // Sorteia aleatoriamente quem começa ao montar o componente
    setCurrentPlayer(Math.random() < 0.5 ? 1 : 2);
  }, []);

  const player1Pits = [0, 1, 2, 3, 4, 5];
  const player2Pits = [7, 8, 9, 10, 11, 12];
  const player1Mancala = 6;
  const player2Mancala = 13;

  const currentPlayerName = playerNames[`player${currentPlayer}`];
  const opponentPlayerName = playerNames[`player${currentPlayer === 1 ? 2 : 1}`];

  const isOwnPit = (player, index) => {
    return player === 1 ? player1Pits.includes(index) : player2Pits.includes(index);
  };

  const getMancalaForPlayer = (player) => (player === 1 ? player1Mancala : player2Mancala);

  const getOpponentMancala = (player) => (player === 1 ? player2Mancala : player1Mancala);

  const isPlayerPitRowEmpty = (player, boardState) => {
    const pits = player === 1 ? player1Pits : player2Pits;
    return pits.every((index) => boardState[index] === 0);
  };

  const collectRemainingSeeds = (boardState) => {
    const nextBoard = [...boardState];
    if (isPlayerPitRowEmpty(1, nextBoard) && !isPlayerPitRowEmpty(2, nextBoard)) {
      const remaining = player2Pits.reduce((sum, index) => sum + nextBoard[index], 0);
      player2Pits.forEach((index) => {
        nextBoard[index] = 0;
      });
      nextBoard[player2Mancala] += remaining;
    }

    if (isPlayerPitRowEmpty(2, nextBoard) && !isPlayerPitRowEmpty(1, nextBoard)) {
      const remaining = player1Pits.reduce((sum, index) => sum + nextBoard[index], 0);
      player1Pits.forEach((index) => {
        nextBoard[index] = 0;
      });
      nextBoard[player1Mancala] += remaining;
    }

    return nextBoard;
  };

  const determineWinner = (boardState) => {
    if (boardState[player1Mancala] > boardState[player2Mancala]) return 1;
    if (boardState[player2Mancala] > boardState[player1Mancala]) return 2;
    return 'draw';
  };

  const checkEndGame = (boardState) => {
    const player1Empty = isPlayerPitRowEmpty(1, boardState);
    const player2Empty = isPlayerPitRowEmpty(2, boardState);
    if (player1Empty || player2Empty) {
      const collectedBoard = collectRemainingSeeds(boardState);
      setGameOver(true);
      const finalWinner = determineWinner(collectedBoard);
      setWinner(finalWinner);
      setBoard(collectedBoard);
      const finalText =
        finalWinner === 'draw'
          ? 'Empate!'
          : `${playerNames[`player${finalWinner}`]} venceu.`;
      setInfoMessage(
        `${finalText} Pontuação final — ${playerNames.player1}: ${collectedBoard[player1Mancala]}, ${playerNames.player2}: ${collectedBoard[player2Mancala]}.`
      );
      return true;
    }
    return false;
  };

  const handlePitClick = (index) => {
    if (gameOver) return;
    if (!isOwnPit(currentPlayer, index)) return;
    if (board[index] === 0) return;

    const nextBoard = [...board];
    let stones = nextBoard[index];
    nextBoard[index] = 0;
    let currentIndex = index;

    // Distribui sementes anti-horário, pulando o Mancala adversário
    while (stones > 0) {
      currentIndex = (currentIndex + 1) % 14;
      if (currentPlayer === 1 && currentIndex === player2Mancala) continue;
      if (currentPlayer === 2 && currentIndex === player1Mancala) continue;
      nextBoard[currentIndex] += 1;
      stones -= 1;
    }

    const lastIndex = currentIndex;
    const ownMancala = getMancalaForPlayer(currentPlayer);
    const opponentPlayer = currentPlayer === 1 ? 2 : 1;
    const selectedPitLabel = currentPlayer === 1 ? `P1-${index + 1}` : `P2-${index - 6}`;
    let moveMessage = `${currentPlayerName} semeou ${board[index]} sementes de ${selectedPitLabel}.`;
    let captureMessage = '';

    // Captura: se a última semente cair em uma casa vazia do jogador atual,
    // leva a semente depositada mais todas as sementes da casa oposta.
    const isCaptureMove = isOwnPit(currentPlayer, lastIndex) && nextBoard[lastIndex] === 1;
    if (isCaptureMove) {
      const oppositeIndex = 12 - lastIndex;
      const oppositeSeeds = nextBoard[oppositeIndex];
      const capturedTotal = oppositeSeeds + 1;
      nextBoard[ownMancala] += capturedTotal;
      nextBoard[lastIndex] = 0;
      nextBoard[oppositeIndex] = 0;
      captureMessage = ` Captura! Última semente caiu em casa vazia do seu lado e capturou ${oppositeSeeds} semente(s) da casa oposta. ${capturedTotal} sementes foram movidas para o seu Mancala.`;
      moveMessage += captureMessage;
    }

    const hadExtraTurn = lastIndex === ownMancala;
    const nextPlayer = hadExtraTurn ? currentPlayer : opponentPlayer;
    if (hadExtraTurn) {
      moveMessage += ` Última semente caiu no Mancala de ${currentPlayerName}, você ganha jogada extra.`;
    } else if (!isCaptureMove) {
      moveMessage += ` Próximo jogador: ${playerNames[`player${nextPlayer}`]}.`;
    }

    setBoard(nextBoard);
    setLastMove({ index: lastIndex, capture: isCaptureMove, extraTurn: hadExtraTurn });
    if (!checkEndGame(nextBoard)) {
      setCurrentPlayer(nextPlayer);
      setInfoMessage(moveMessage);
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer(Math.random() < 0.5 ? 1 : 2);
    setGameOver(false);
    setWinner(null);
    setLastMove({ index: null, capture: false, extraTurn: false });
    setInfoMessage('Partida reiniciada. Boa sorte!');
  };

  const goToStart = () => {
    setStarted(false);
    setBoard(INITIAL_BOARD);
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
    setLastMove({ index: null, capture: false, extraTurn: false });
    setInfoMessage('Atualize os nomes se quiser e inicie outra partida.');
    setPlayerInputs(playerNames);
  };

  const showHelp = () => {
    setInfoMessage(
      'Dica: clique em uma cavidade do seu lado para semear as sementes. Capture quando a última cair em uma casa vazia do seu lado.'
    );
  };

  const handleInputChange = (player, value) => {
    setPlayerInputs((prev) => ({ ...prev, [player]: value }));
  };

  const startGame = () => {
    const names = {
      player1: playerInputs.player1.trim() || 'Jogador 1',
      player2: playerInputs.player2.trim() || 'Jogador 2',
    };
    const firstPlayer = Math.random() < 0.5 ? 1 : 2;
    setPlayerNames(names);
    setStarted(true);
    setCurrentPlayer(firstPlayer);
    setInfoMessage(`Bem-vindo, ${names.player1} e ${names.player2}! ${names[`player${firstPlayer}`]} começa.`);
  };

  const gameStatus = useMemo(() => {
    if (!started) {
      return 'Preparando partida...';
    }
    if (gameOver) {
      if (winner === 'draw') return 'Empate!';
      return `Fim de jogo: vencedor é ${playerNames[`player${winner}`]}`;
    }
    return `Vez de: ${currentPlayerName}`;
  }, [currentPlayer, currentPlayerName, gameOver, started, winner, playerNames]);

  return (
    <div className="mancala-shell">
      <h1>Mancala</h1>
      <p className="subtitle">De origem africana e com ricas variações, o Mancala nos ensina que a vida é um fascinante exercício de semeadura. Mais do que um jogo, é uma lição sobre como cultivar e distribuir nossos recursos e essência para que, ao final do ciclo, possamos colher os melhores frutos.</p>

      {!started ? (
        <div className="startup-screen">
          <div className="startup-card">
            <h2>Bem-vindo ao Mancala</h2>
            <p className="subtitle">Escolha os nomes dos jogadores e revise as regras antes de começar.</p>

            <div className="input-group">
              <label htmlFor="player1">Seu nome</label>
              <input
                id="player1"
                type="text"
                value={playerInputs.player1}
                placeholder="Jogador 1"
                onChange={(e) => handleInputChange('player1', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="player2">Nome do adversário</label>
              <input
                id="player2"
                type="text"
                value={playerInputs.player2}
                placeholder="Jogador 2"
                onChange={(e) => handleInputChange('player2', e.target.value)}
              />
            </div>

            <div className="rules-panel">
              <h3>Regras principais</h3>
              <ul className="rules-list">
                <li>12 casas começam com 4 sementes; cada Mancala inicia com 0.</li>
                <li>Clique em uma casa do seu lado para semear anti-horário.</li>
                <li>Pule o Mancala do adversário enquanto distribui sementes.</li>
                <li>Se a última semente cair em uma casa vazia do seu lado, capture também as sementes opostas.</li>
                <li>O jogo termina quando um lado fica sem sementes e o outro coleta o restante.</li>
              </ul>
            </div>

            <button className="start-button" onClick={startGame}>
              Começar partida
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="status-box">
            <div>
              <span className="status-label">Status:</span>
              <span className="status-text">{gameStatus}</span>
            </div>
            <div className="info-box">{infoMessage}</div>
          </div>

          <div className="board-shell">
            <div className="mancala-pit mancala-large mancala-top">
              <span className="mancala-title">Mancala P2</span>
              <span className="seed-count">{board[player2Mancala]}</span>
            </div>

            <div className="middle-board">
              <div className="pit-row top-row">
                {player2Pits.slice().reverse().map((index) => {
                  const disabled = !isOwnPit(currentPlayer, index) || board[index] === 0 || gameOver;
                  const isLast = lastMove.index === index;
                  return (
                    <button
                      key={index}
                      className={`pit ${disabled ? 'pit-disabled' : ''} ${isLast ? 'pit-last-move' : ''}`}
                      onClick={() => handlePitClick(index)}
                      disabled={disabled}
                    >
                      <span className="pit-label">{`P2-${index - 6}`}</span>
                      <span className="pit-seeds">{board[index]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pit-row bottom-row">
                {player1Pits.map((index) => {
                  const disabled = !isOwnPit(currentPlayer, index) || board[index] === 0 || gameOver;
                  const isLast = lastMove.index === index;
                  return (
                    <button
                      key={index}
                      className={`pit ${disabled ? 'pit-disabled' : ''} ${isLast ? 'pit-last-move' : ''}`}
                      onClick={() => handlePitClick(index)}
                      disabled={disabled}
                    >
                      <span className="pit-label">{`P1-${index + 1}`}</span>
                      <span className="pit-seeds">{board[index]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mancala-pit mancala-large mancala-bottom">
              <span className="mancala-title">Mancala P1</span>
              <span className="seed-count">{board[player1Mancala]}</span>
            </div>
          </div>

          <div className="controls">
            <button className="help-button" type="button" onClick={showHelp}>
              <span className="button-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.25 14.4a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm1.62-5.6c0 .7-.5 1-1.3 1h-.3v.8h-.95v-.9c.5-.1 1-.3 1.3-.7.3-.4.4-.8.4-1.3 0-.9-.6-1.4-1.4-1.4-.7 0-1.3.3-1.6.8l-.9-.5c.4-.8 1.2-1.3 2.6-1.3 1.4 0 2.5.9 2.5 2.3Z" />
                </svg>
              </span>
              Ajuda
            </button>
            <button className="ghost-button" onClick={goToStart}>
              Voltar à tela inicial
            </button>
            <button className="reset-button" onClick={resetGame}>
              Reiniciar jogo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MancalaGame;
