import { v4 as uuidv4 } from "uuid";
import { logger } from "../../services";
import {
  ActiveCall,
  CallInitiateData,
  CallStatus,
  CallType,
  UserCallState,
  CallManager as ICallManager
} from "../types/webrtc.types";

// Map to store active calls (callId -> ActiveCall)
const activeCalls = new Map<string, ActiveCall>();

// Map to store user call states (userId -> UserCallState)
const userCallStates = new Map<string, UserCallState>();

// Call timeout duration (30 seconds for ringing)
const CALL_TIMEOUT_MS = 30000;

// Map to store call timeouts
const callTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Call Manager Implementation
 */
export class CallManager implements ICallManager {
  
  /**
   * Create a new call
   */
  createCall(callData: CallInitiateData): ActiveCall {
    const call: ActiveCall = {
      callId: callData.callId,
      callType: callData.callType,
      status: CallStatus.INITIATING,
      participants: [callData.from, callData.to],
      initiator: callData.from,
      chatId: callData.chatId,
      startTime: new Date(),
    };

    activeCalls.set(call.callId, call);
    
    // Set user call states
    this.setUserCallState(callData.from, call.callId, true, false);
    this.setUserCallState(callData.to, call.callId, false, true);

    // Set call timeout
    this.setCallTimeout(call.callId);

    logger.info(`Call created: ${call.callId} (${callData.from} -> ${callData.to})`);
    return call;
  }

  /**
   * Get call by ID
   */
  getCall(callId: string): ActiveCall | null {
    return activeCalls.get(callId) || null;
  }

  /**
   * Update call status
   */
  updateCallStatus(callId: string, status: CallStatus): void {
    const call = activeCalls.get(callId);
    if (call) {
      call.status = status;
      
      // Clear timeout when call is accepted or ended
      if (status === CallStatus.CONNECTED || status === CallStatus.ENDED || 
          status === CallStatus.REJECTED || status === CallStatus.FAILED) {
        this.clearCallTimeout(callId);
      }

      // Update user states based on call status
      if (status === CallStatus.CONNECTED) {
        call.participants.forEach(userId => {
          this.setUserCallState(userId, callId, true, false);
        });
      } else if (status === CallStatus.ENDED || status === CallStatus.REJECTED || 
                 status === CallStatus.FAILED || status === CallStatus.MISSED) {
        call.participants.forEach(userId => {
          this.clearUserCallState(userId);
        });
      }

      logger.info(`Call ${callId} status updated to: ${status}`);
    }
  }

  /**
   * End a call
   */
  endCall(callId: string, reason?: string): void {
    const call = activeCalls.get(callId);
    if (call) {
      call.status = CallStatus.ENDED;
      call.endTime = new Date();
      
      if (call.startTime && call.endTime) {
        call.duration = call.endTime.getTime() - call.startTime.getTime();
      }

      // Clear user call states
      call.participants.forEach(userId => {
        this.clearUserCallState(userId);
      });

      // Clear timeout
      this.clearCallTimeout(callId);

      logger.info(`Call ${callId} ended. Reason: ${reason || 'Normal termination'}`);
    }
  }

  /**
   * Get user's current call
   */
  getUserCall(userId: string): ActiveCall | null {
    const userState = userCallStates.get(userId);
    if (userState && userState.currentCall) {
      return userState.currentCall;
    }
    return null;
  }

  /**
   * Check if user is in a call
   */
  isUserInCall(userId: string): boolean {
    const userState = userCallStates.get(userId);
    return userState ? userState.isInCall : false;
  }

  /**
   * Check if user is busy (in call or has incoming call)
   */
  isUserBusy(userId: string): boolean {
    const userState = userCallStates.get(userId);
    return userState ? (userState.isInCall || userState.isBusy) : false;
  }

  /**
   * Get all active calls
   */
  getAllActiveCalls(): ActiveCall[] {
    return Array.from(activeCalls.values());
  }

  /**
   * Clean up call data
   */
  cleanupCall(callId: string): void {
    const call = activeCalls.get(callId);
    if (call) {
      // Clear user call states
      call.participants.forEach(userId => {
        this.clearUserCallState(userId);
      });

      // Clear timeout
      this.clearCallTimeout(callId);

      // Remove call from active calls
      activeCalls.delete(callId);

      logger.info(`Call ${callId} cleaned up`);
    }
  }

  /**
   * Set user call state
   */
  private setUserCallState(userId: string, callId: string, isInCall: boolean, isBusy: boolean): void {
    const call = activeCalls.get(callId);
    if (call) {
      userCallStates.set(userId, {
        userId,
        socketId: '', // Will be set by socket handlers
        currentCall: call,
        isInCall,
        isBusy
      });
    }
  }

  /**
   * Clear user call state
   */
  private clearUserCallState(userId: string): void {
    userCallStates.delete(userId);
  }

  /**
   * Set call timeout
   */
  private setCallTimeout(callId: string): void {
    const timeout = setTimeout(() => {
      const call = activeCalls.get(callId);
      if (call && call.status === CallStatus.RINGING) {
        this.updateCallStatus(callId, CallStatus.MISSED);
        logger.info(`Call ${callId} timed out`);
      }
    }, CALL_TIMEOUT_MS);

    callTimeouts.set(callId, timeout);
  }

  /**
   * Clear call timeout
   */
  private clearCallTimeout(callId: string): void {
    const timeout = callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      callTimeouts.delete(callId);
    }
  }

  /**
   * Get user call state
   */
  getUserCallState(userId: string): UserCallState | null {
    return userCallStates.get(userId) || null;
  }

  /**
   * Update user socket ID
   */
  updateUserSocketId(userId: string, socketId: string): void {
    const userState = userCallStates.get(userId);
    if (userState) {
      userState.socketId = socketId;
      userCallStates.set(userId, userState);
    }
  }

  /**
   * Get call statistics
   */
  getCallStats(): {
    totalActiveCalls: number;
    totalUsersInCalls: number;
    callsByType: Record<CallType, number>;
    callsByStatus: Record<CallStatus, number>;
  } {
    const calls = Array.from(activeCalls.values());
    
    const callsByType = calls.reduce((acc, call) => {
      acc[call.callType] = (acc[call.callType] || 0) + 1;
      return acc;
    }, {} as Record<CallType, number>);

    const callsByStatus = calls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {} as Record<CallStatus, number>);

    return {
      totalActiveCalls: calls.length,
      totalUsersInCalls: userCallStates.size,
      callsByType,
      callsByStatus
    };
  }
}

// Export singleton instance
export const callManager = new CallManager();

// Helper function to generate call ID
export const generateCallId = (): string => {
  return uuidv4();
};
