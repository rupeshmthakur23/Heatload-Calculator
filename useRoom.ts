// src/pages/ApplicationPage/components/HeatLoadCalculator/hooks/useRoom.ts

import { useCallback } from "react";
import { useAppState, useAppActions } from "./useAppState";
import { Room } from "./types";

/**
 * Custom hook to read and update a single Room by its ID.
 */
export function useRoom(roomId: string) {
  const { floors } = useAppState();
  const { replaceRoom } = useAppActions();

  // Find the room object in the nested floors → rooms array
  const room = floors
    .flatMap((floor) => floor.rooms)
    .find((r) => r.id === roomId) || null;

  // Memoized updater that dispatches the replaced room back into state
  const updateRoom = useCallback(
    (updatedRoom: Room) => {
      replaceRoom(updatedRoom);
    },
    [replaceRoom]
  );

  return { room, updateRoom };
}
