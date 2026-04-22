import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const INITIAL_BOARD = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
const PLAYER1_PITS = [0, 1, 2, 3, 4, 5];
const PLAYER2_PITS = [7, 8, 9, 10, 11, 12];
const PLAYER1_MANCALA = 6;
const PLAYER2_MANCALA = 13;

const shadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  android: {
    elevation: 5,
  },
  default: {},
});

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
    setCurrentPlayer(Math.random() < 0.5 ? 1 : 2);
  }, []);

  const currentPlayerName = playerNames[`player${currentPlayer}`];

  const isOwnPit = (player, index) => {
    return player === 1 ? PLAYER1_PITS.includes(index) : PLAYER2_PITS.includes(index);
  };

  const isPlayerPitRowEmpty = (player, boardState) => {
    const pits = player === 1 ? PLAYER1_PITS : PLAYER2_PITS;
    return pits.every((index) => boardState[index] === 0);
  };

  const collectRemainingSeeds = (boardState) => {
    const nextBoard = [...boardState];

    if (isPlayerPitRowEmpty(1, nextBoard) && !isPlayerPitRowEmpty(2, nextBoard)) {
      const remaining = PLAYER2_PITS.reduce((sum, index) => sum + nextBoard[index], 0);
      PLAYER2_PITS.forEach((index) => {
        nextBoard[index] = 0;
      });
      nextBoard[PLAYER2_MANCALA] += remaining;
    }

    if (isPlayerPitRowEmpty(2, nextBoard) && !isPlayerPitRowEmpty(1, nextBoard)) {
      const remaining = PLAYER1_PITS.reduce((sum, index) => sum + nextBoard[index], 0);
      PLAYER1_PITS.forEach((index) => {
        nextBoard[index] = 0;
      });
      nextBoard[PLAYER1_MANCALA] += remaining;
    }

    return nextBoard;
  };

  const determineWinner = (boardState) => {
    if (boardState[PLAYER1_MANCALA] > boardState[PLAYER2_MANCALA]) return 1;
    if (boardState[PLAYER2_MANCALA] > boardState[PLAYER1_MANCALA]) return 2;
    return 'draw';
  };

  const checkEndGame = (boardState) => {
    const player1Empty = isPlayerPitRowEmpty(1, boardState);
    const player2Empty = isPlayerPitRowEmpty(2, boardState);

    if (!player1Empty && !player2Empty) {
      return false;
    }

    const collectedBoard = collectRemainingSeeds(boardState);
    setGameOver(true);
    const finalWinner = determineWinner(collectedBoard);
    setWinner(finalWinner);
    setBoard(collectedBoard);

    const finalText = finalWinner === 'draw' ? 'Empate!' : `${playerNames[`player${finalWinner}`]} venceu.`;
    setInfoMessage(
      `${finalText} Pontuacao final - ${playerNames.player1}: ${collectedBoard[PLAYER1_MANCALA]}, ${playerNames.player2}: ${collectedBoard[PLAYER2_MANCALA]}.`
    );

    return true;
  };

  const handlePitPress = (index) => {
    if (gameOver || !isOwnPit(currentPlayer, index) || board[index] === 0) {
      return;
    }

    const nextBoard = [...board];
    const selectedStones = nextBoard[index];
    let stones = selectedStones;
    nextBoard[index] = 0;

    let currentIndex = index;
    while (stones > 0) {
      currentIndex = (currentIndex + 1) % 14;
      if (currentPlayer === 1 && currentIndex === PLAYER2_MANCALA) continue;
      if (currentPlayer === 2 && currentIndex === PLAYER1_MANCALA) continue;
      nextBoard[currentIndex] += 1;
      stones -= 1;
    }

    const ownMancala = currentPlayer === 1 ? PLAYER1_MANCALA : PLAYER2_MANCALA;
    const opponentPlayer = currentPlayer === 1 ? 2 : 1;
    const selectedPitLabel = currentPlayer === 1 ? `P1-${index + 1}` : `P2-${index - 6}`;
    let moveMessage = `${currentPlayerName} semeou ${selectedStones} sementes de ${selectedPitLabel}.`;

    const isCaptureMove = isOwnPit(currentPlayer, currentIndex) && nextBoard[currentIndex] === 1;
    if (isCaptureMove) {
      const oppositeIndex = 12 - currentIndex;
      const oppositeSeeds = nextBoard[oppositeIndex];
      const capturedTotal = oppositeSeeds + 1;
      nextBoard[ownMancala] += capturedTotal;
      nextBoard[currentIndex] = 0;
      nextBoard[oppositeIndex] = 0;
      moveMessage += ` Captura! Voce coletou ${capturedTotal} sementes para o Mancala.`;
    }

    const hadExtraTurn = currentIndex === ownMancala;
    const nextPlayer = hadExtraTurn ? currentPlayer : opponentPlayer;
    if (hadExtraTurn) {
      moveMessage += ` Jogada extra para ${currentPlayerName}.`;
    } else if (!isCaptureMove) {
      moveMessage += ` Proximo jogador: ${playerNames[`player${nextPlayer}`]}.`;
    }

    setBoard(nextBoard);
    setLastMove({ index: currentIndex, capture: isCaptureMove, extraTurn: hadExtraTurn });

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
    setInfoMessage('Atualize os nomes e inicie outra partida.');
    setPlayerInputs(playerNames);
  };

  const showHelp = () => {
    setInfoMessage(
      'Dica: escolha uma casa do seu lado para semear. Se a ultima cair em casa vazia do seu lado, voce captura as sementes opostas.'
    );
  };

  const handleInputChange = (player, value) => {
    setPlayerInputs((previous) => ({ ...previous, [player]: value }));
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
    setInfoMessage(`Bem-vindo, ${names.player1} e ${names.player2}. ${names[`player${firstPlayer}`]} comeca.`);
  };

  const gameStatus = useMemo(() => {
    if (!started) {
      return 'Preparando partida...';
    }
    if (gameOver) {
      if (winner === 'draw') return 'Empate!';
      return `Fim de jogo: vencedor ${playerNames[`player${winner}`]}`;
    }
    return `Vez de: ${currentPlayerName}`;
  }, [currentPlayerName, gameOver, playerNames, started, winner]);

  const getPitSeedStyle = (index) => {
    const remainder = index % 3;
    if (remainder === 0) return styles.seedBadgeIndigo;
    if (remainder === 1) return styles.seedBadgeTerracotta;
    return styles.seedBadgeEmerald;
  };

  const renderPit = (index, player) => {
    const disabled = !isOwnPit(currentPlayer, index) || board[index] === 0 || gameOver;
    const isLast = lastMove.index === index;

    return (
      <Pressable
        key={index}
        style={({ pressed }) => [
          styles.pit,
          disabled && styles.pitDisabled,
          isLast && styles.pitLastMove,
          pressed && !disabled && styles.pitPressed,
        ]}
        onPress={() => handlePitPress(index)}
        disabled={disabled}
      >
        <Text style={styles.pitLabel}>{player === 1 ? `P1-${index + 1}` : `P2-${index - 6}`}</Text>
        <View style={[styles.seedBadge, getPitSeedStyle(index)]}>
          <Text style={styles.seedBadgeText}>{board[index]}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={require('./img/LogoMancala.jpg')} resizeMode="cover" style={styles.background}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.shell}>
              <Text style={styles.title}>Mancala</Text>
              <Text style={styles.subtitle}>
                De origem africana e com ricas variacoes, o Mancala ensina sobre semeadura e estrategia.
              </Text>

              {!started ? (
                <View style={styles.startupCard}>
                  <Text style={styles.startupTitle}>Bem-vindo ao Mancala</Text>
                  <Text style={styles.startupSubtitle}>
                    Escolha os nomes dos jogadores e revise as regras antes de comecar.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Seu nome</Text>
                    <TextInput
                      style={styles.input}
                      value={playerInputs.player1}
                      onChangeText={(value) => handleInputChange('player1', value)}
                      placeholder="Jogador 1"
                      placeholderTextColor="#B6C2D8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nome do adversario</Text>
                    <TextInput
                      style={styles.input}
                      value={playerInputs.player2}
                      onChangeText={(value) => handleInputChange('player2', value)}
                      placeholder="Jogador 2"
                      placeholderTextColor="#B6C2D8"
                    />
                  </View>

                  <View style={styles.rulesPanel}>
                    <Text style={styles.rulesTitle}>Regras principais</Text>
                    <Text style={styles.ruleItem}>- 12 casas comecam com 4 sementes; cada Mancala inicia com 0.</Text>
                    <Text style={styles.ruleItem}>- Toque em uma casa do seu lado para semear no sentido anti-horario.</Text>
                    <Text style={styles.ruleItem}>- Pule o Mancala do adversario durante a distribuicao.</Text>
                    <Text style={styles.ruleItem}>- Ultima semente em casa vazia do seu lado gera captura.</Text>
                    <Text style={styles.ruleItem}>- O jogo termina quando um lado fica sem sementes.</Text>
                  </View>

                  <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]} onPress={startGame}>
                    <Text style={styles.startButtonText}>Comecar partida</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.statusBox}>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Status:</Text>
                      <Text style={styles.statusText}>{gameStatus}</Text>
                    </View>
                    <Text style={styles.infoText}>{infoMessage}</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.boardScrollContent}
                  >
                    <View style={styles.boardBase}>
                      <View style={styles.boardShell}>
                        <View style={styles.mancalaPit}>
                          <Text style={styles.mancalaTitle}>{playerNames.player2}</Text>
                          <Text style={styles.mancalaCount}>{board[PLAYER2_MANCALA]}</Text>
                        </View>

                        <View style={styles.middleBoard}>
                          <View style={styles.pitRow}>{PLAYER2_PITS.slice().reverse().map((index) => renderPit(index, 2))}</View>
                          <View style={styles.pitRow}>{PLAYER1_PITS.map((index) => renderPit(index, 1))}</View>
                        </View>

                        <View style={styles.mancalaPit}>
                          <Text style={styles.mancalaTitle}>{playerNames.player1}</Text>
                          <Text style={styles.mancalaCount}>{board[PLAYER1_MANCALA]}</Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.controls}>
                    <Pressable style={({ pressed }) => [styles.helpButton, pressed && styles.buttonPressed]} onPress={showHelp}>
                      <Text style={styles.controlText}>Ajuda</Text>
                    </Pressable>

                    <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={goToStart}>
                      <Text style={styles.controlText}>Tela inicial</Text>
                    </Pressable>

                    <Pressable style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]} onPress={resetGame}>
                      <Text style={styles.controlText}>Reiniciar</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060B15',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 11, 21, 0.88)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 1040,
  },
  title: {
    textAlign: 'center',
    fontSize: 46,
    fontWeight: '900',
    color: '#F79A2F',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#E8E5D3',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  startupCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(12, 20, 36, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    ...shadow,
  },
  startupTitle: {
    textAlign: 'center',
    color: '#F1A348',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  startupSubtitle: {
    textAlign: 'center',
    color: '#D9D7C9',
    marginBottom: 18,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#F5F5DC',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rulesPanel: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  rulesTitle: {
    color: '#D49137',
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 16,
  },
  ruleItem: {
    color: '#EAE7DA',
    lineHeight: 20,
    marginBottom: 4,
    fontSize: 13,
  },
  startButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D45F1D',
    borderWidth: 1,
    borderColor: '#F39C4D',
    ...shadow,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  statusBox: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(8, 16, 32, 0.95)',
    marginBottom: 14,
    ...shadow,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#F5F5DC',
    fontWeight: '700',
    marginRight: 8,
  },
  statusText: {
    color: '#F4C06D',
    fontWeight: '800',
  },
  infoText: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,145,55,0.3)',
    backgroundColor: 'rgba(21, 35, 63, 0.95)',
    color: '#F1EEDB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  boardScrollContent: {
    paddingVertical: 4,
  },
  boardBase: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7, 14, 28, 0.92)',
    padding: 16,
    ...shadow,
  },
  boardShell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mancalaPit: {
    width: 108,
    minHeight: 286,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(18, 36, 66, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    ...shadow,
  },
  mancalaTitle: {
    color: '#F5F5DC',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  mancalaCount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  middleBoard: {
    marginHorizontal: 10,
  },
  pitRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pit: {
    width: 92,
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(17, 33, 58, 0.94)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    marginHorizontal: 4,
    ...shadow,
  },
  pitPressed: {
    transform: [{ scale: 0.97 }],
  },
  pitDisabled: {
    opacity: 0.42,
  },
  pitLastMove: {
    borderColor: '#D49137',
    backgroundColor: 'rgba(74, 56, 22, 0.88)',
  },
  pitLabel: {
    color: '#F3EFD9',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  seedBadge: {
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  seedBadgeIndigo: {
    backgroundColor: '#2E4A79',
  },
  seedBadgeTerracotta: {
    backgroundColor: '#A95B3D',
  },
  seedBadgeEmerald: {
    backgroundColor: '#256447',
  },
  seedBadgeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  controls: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  helpButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3A34A',
    backgroundColor: '#D0671D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginTop: 8,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#75B95B',
    backgroundColor: '#2E6A32',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginTop: 8,
  },
  resetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#8CB7FF',
    backgroundColor: '#2F4C7B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginTop: 8,
  },
  controlText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MancalaGame;
