import { Server } from "socket.io";
import { logger } from "./logger";
import { callManager, generateCallId } from "../socket/utils/callManager";
import { emitToUser, isUserOnline } from "../socket/utils/socketUtils";
import {
  CallType,
  CallStatus,
  CallInitiateData,
  ActiveCall
} from "../socket/types/webrtc.types";

// Socket.io server instance
let io: Server;

/**
 * Set the Socket.io instance - should be called once from app.ts
 * @param socketIo - The Socket.io server instance
 */
export const setWebRTCSocketInstance = (socketIo: Server) => {
  io = socketIo;
  logger.info("Socket.io instance set in WebRTC service");
};

/**
 * Get the Socket.io instance
 * @returns The Socket.io server instance or null if not set
 */
export const getWebRTCSocketInstance = (): Server | null => {
  return io || null;
};

/**
 * Initiate a call between two users
 * @param fromUserId - ID of the user initiating the call
 * @param toUserId - ID of the user receiving the call
 * @param callType - Type of call (audio or video)
 * @param chatId - Optional chat ID if call is within a chat context
 * @returns Promise<{ success: boolean, callId?: string, error?: string }>
 */
export const initiateCall = async (
  fromUserId: string,
  toUserId: string,
  callType: CallType,
  chatId?: string
): Promise<{ success: boolean; callId?: string; error?: string }> => {
  try {
    if (!io) {
      throw new Error("Socket.io instance not set");
    }

    // Validate input
    if (!fromUserId || !toUserId) {
      throw new Error("Both fromUserId and toUserId are required");
    }

    if (!Object.values(CallType).includes(callType)) {
      throw new Error("Invalid call type");
    }

    // Check if initiator is already in a call
    if (callManager.isUserBusy(fromUserId)) {
      throw new Error("You are already in an active call. Please end your current call before starting a new one.");
    }

    // Check if target user is online
    if (!isUserOnline(toUserId)) {
      throw new Error("The user you're trying to call is currently offline. They need to be online and connected to receive calls. Please try again when they're active.");
    }

    // Check if target user is busy
    if (callManager.isUserBusy(toUserId)) {
      throw new Error("The user you're trying to call is currently busy on another call. Please try again later.");
    }

    // Generate call ID and create call data
    const callId = generateCallId();
    const callData: CallInitiateData = {
      callId,
      callType,
      from: fromUserId,
      to: toUserId,
      chatId,
      timestamp: new Date()
    };

    // Create the call
    const call = callManager.createCall(callData);

    // Update call status to ringing
    callManager.updateCallStatus(callId, CallStatus.RINGING);

    // Emit call invitation to target user
    const success = emitToUser(io, toUserId, "call:incoming", {
      callId,
      callType,
      from: fromUserId,
      chatId,
      timestamp: new Date()
    });

    if (!success) {
      callManager.cleanupCall(callId);
      throw new Error("Failed to deliver call invitation");
    }

    logger.info(`Call ${callId} initiated successfully via service`);
    return { success: true, callId };
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error initiating call";
    logger.error(`Error initiating call via service: ${errorMessage}`, error);
    return { success: false, error: errorMessage };
  }
};

/**
 * End a call
 * @param callId - ID of the call to end
 * @param userId - ID of the user ending the call
 * @param reason - Optional reason for ending the call
 * @returns Promise<{ success: boolean, error?: string }>
 */
export const endCall = async (
  callId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!io) {
      throw new Error("Socket.io instance not set");
    }

    const call = callManager.getCall(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (!call.participants.includes(userId)) {
      throw new Error("User not part of this call");
    }

    // Update call status
    callManager.endCall(callId, reason);

    // Notify other participants
    call.participants.forEach(participantId => {
      if (participantId !== userId) {
        emitToUser(io, participantId, "call:ended", {
          callId,
          from: userId,
          reason,
          timestamp: new Date()
        });
      }
    });

    // Clean up call
    callManager.cleanupCall(callId);

    logger.info(`Call ${callId} ended via service`);
    return { success: true };
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error ending call";
    logger.error(`Error ending call via service: ${errorMessage}`, error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get call information
 * @param callId - ID of the call
 * @returns ActiveCall | null
 */
export const getCallInfo = (callId: string): ActiveCall | null => {
  return callManager.getCall(callId);
};

/**
 * Get user's current call
 * @param userId - ID of the user
 * @returns ActiveCall | null
 */
export const getUserCurrentCall = (userId: string): ActiveCall | null => {
  return callManager.getUserCall(userId);
};

/**
 * Check if user is in a call
 * @param userId - ID of the user
 * @returns boolean
 */
export const isUserInCall = (userId: string): boolean => {
  return callManager.isUserInCall(userId);
};

/**
 * Check if user is busy (in call or has incoming call)
 * @param userId - ID of the user
 * @returns boolean
 */
export const isUserBusy = (userId: string): boolean => {
  return callManager.isUserBusy(userId);
};

/**
 * Get all active calls
 * @returns ActiveCall[]
 */
export const getAllActiveCalls = (): ActiveCall[] => {
  return callManager.getAllActiveCalls();
};

/**
 * Get call statistics
 * @returns Call statistics object
 */
export const getCallStatistics = () => {
  return callManager.getCallStats();
};

/**
 * Emit call status update to participants
 * @param callId - ID of the call
 * @param status - New call status
 * @param data - Additional data to send
 */
export const emitCallStatusUpdate = (
  callId: string,
  status: CallStatus,
  data?: any
): void => {
  if (!io) {
    logger.warn("Socket.io instance not set, cannot emit call status update");
    return;
  }

  const call = callManager.getCall(callId);
  if (!call) {
    logger.warn(`Cannot emit status update: Call ${callId} not found`);
    return;
  }

  // Emit to all participants
  call.participants.forEach(participantId => {
    emitToUser(io, participantId, "call:status-update", {
      callId,
      status,
      timestamp: new Date(),
      ...data
    });
  });

  logger.info(`Call status update emitted for call ${callId}: ${status}`);
};

/**
 * Clean up expired or stale calls
 * This should be called periodically to clean up calls that may have been left in an inconsistent state
 */
export const cleanupStaleCalls = (): void => {
  const activeCalls = callManager.getAllActiveCalls();
  const now = new Date();
  const STALE_CALL_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  activeCalls.forEach(call => {
    const callAge = now.getTime() - call.startTime.getTime();
    
    // Clean up calls that have been in non-connected states for too long
    if (callAge > STALE_CALL_THRESHOLD && 
        (call.status === CallStatus.RINGING || call.status === CallStatus.CONNECTING)) {
      logger.info(`Cleaning up stale call: ${call.callId} (age: ${callAge}ms, status: ${call.status})`);
      
      // Notify participants that call failed
      call.participants.forEach(participantId => {
        if (io) {
          emitToUser(io, participantId, "call:ended", {
            callId: call.callId,
            reason: "Call timeout",
            timestamp: new Date()
          });
        }
      });

      // Clean up the call
      callManager.cleanupCall(call.callId);
    }
  });
};
