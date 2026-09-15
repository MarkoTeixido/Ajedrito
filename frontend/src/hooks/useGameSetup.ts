'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createGame,
  getGame,
  getDifficultyProfiles,
  type GameMode,
  type DifficultyProfile,
  type GameStateResponse,
} from '@/lib/api';
import { getLocalGames, saveLocalGame } from '@/lib/gameStorage';

export function useGameSetup() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | null>(null);
  const [profiles, setProfiles] = useState<DifficultyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeSavedGames, setActiveSavedGames] = useState<GameStateResponse[]>([]);

  const handleSelectMode = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    setSelectedColor((prev) => prev || 'white');
  }, []);

  // Cargar perfiles de dificultad de Stockfish
  useEffect(() => {
    setLoadingProfiles(true);
    getDifficultyProfiles('STOCKFISH')
      .then((data) => {
        setProfiles(data);
        if (data.length > 0) {
          const intermedio = data.find((p) => p.name === 'Intermedio');
          setSelectedDifficultyId(intermedio ? intermedio.id : data[0].id);
        }
      })
      .catch((err) => {
        console.error('[GameSetup] Error al cargar perfiles:', err);
      })
      .finally(() => {
        setLoadingProfiles(false);
      });
  }, []);

  // Cargar partidas guardadas pendientes de localStorage
  const loadSavedGames = useCallback(() => {
    const ids = getLocalGames();
    if (ids.length === 0) {
      setActiveSavedGames([]);
      return;
    }
    Promise.allSettled(ids.map((id) => getGame(id))).then((results) => {
      const valid = results
        .filter((r): r is PromiseFulfilledResult<GameStateResponse> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((g) => g.game.result === 'IN_PROGRESS');
      setActiveSavedGames(valid);
    });
  }, []);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  const canStartGame =
    Boolean(selectedMode) &&
    Boolean(selectedColor) &&
    (selectedMode !== 'PV_STOCKFISH' || Boolean(selectedDifficultyId));

  const startNewGame = useCallback(async () => {
    if (!selectedMode || !selectedColor || !canStartGame) {
      throw new Error('Configuración incompleta para iniciar la partida.');
    }

    setIsStartingGame(true);
    try {
      const diffId =
        selectedMode === 'PV_STOCKFISH' ? selectedDifficultyId || undefined : undefined;
      const gameData = await createGame(selectedMode, diffId, selectedColor);
      saveLocalGame(gameData.gameId);
      return gameData;
    } finally {
      setIsStartingGame(false);
    }
  }, [selectedMode, selectedColor, selectedDifficultyId, canStartGame]);

  const resetSetup = useCallback(() => {
    setSelectedMode(null);
    setSelectedColor(null);
    loadSavedGames();
  }, [loadSavedGames]);

  return {
    selectedMode,
    selectedDifficultyId,
    selectedColor,
    profiles,
    loadingProfiles,
    isStartingGame,
    activeSavedGames,
    canStartGame,
    setSelectedMode: handleSelectMode,
    setSelectedDifficultyId,
    setSelectedColor,
    startNewGame,
    resetSetup,
    loadSavedGames,
  };
}
