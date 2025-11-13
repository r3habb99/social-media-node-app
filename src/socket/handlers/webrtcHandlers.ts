import { Server, Socket } from "socket.io";
import { logger } from "../../services";
import { callManager, generateCallId } from "../utils/callManager";
import { emitToUser, getUserSocketIds } from "../utils/socketUtils";
import {
  CallInitiateData,
  CallResponseData,
  CallEndData,
  SDPData,
  ICECandidateData,
  CallType,
  CallStatus
} from "../types/webrtc.types";

/**
 * Register WebRTC event handlers
 */
export const registerWebRTCHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  // Handle call initiation
  socket.on("call:initiate", async (data: Omit<CallInitiateData, 'callId' | 'timestamp'>, callback) => {
    try {
      logger.info(`Call initiation request from ${userId} to ${data.to}`, {
        userId,
        targetUserId: data.to,
        callType: data.callType,
        chatId: data.chatId
      });

      // Validate input data
      if (!data.to || !data.callType) {
        throw new Error("Missing required call data (to, callType)");
      }

      if (data.to === userId) {
        throw new Error("Cannot call yourself");
      }

      if (!Object.values(CallType).includes(data.callType)) {
        throw new Error("Invalid call type");
      }

      // Check if initiator is already in a call
      if (callManager.isUserBusy(userId)) {
        throw new Error("User is already in a call");
      }

      // Check if target user is online
      const targetSocketIds = getUserSocketIds(data.to);
      if (targetSocketIds.length === 0) {
        throw new Error("Target user is not online");
      }

      // Check if target user is busy
      if (callManager.isUserBusy(data.to)) {
        throw new Error("Target user is busy");
      }

      // Generate call ID and create call data
      const callId = generateCallId();
      const callData: CallInitiateData = {
        ...data,
        callId,
        from: userId,
        timestamp: new Date()
      };

      // Create the call
      const call = callManager.createCall(callData);

      // Update call status to ringing
      callManager.updateCallStatus(callId, CallStatus.RINGING);

      logger.info(`Call created and set to ringing`, {
        callId: call.callId,
        participants: call.participants,
        callType: call.callType
      });

      // Get caller's username from socket data for better UX
      const callerUsername = socket.data.username || userId;

      // Emit call invitation to target user with caller info
      const success = emitToUser(io, data.to, "call:incoming", {
        callId,
        callType: data.callType,
        from: userId,
        fromUsername: callerUsername,
        chatId: data.chatId,
        timestamp: new Date()
      });

      if (!success) {
        callManager.cleanupCall(callId);
        throw new Error("Failed to deliver call invitation");
      }

      // Send acknowledgment to caller
      if (typeof callback === 'function') {
        callback({
          success: true,
          callId,
          status: CallStatus.RINGING
        });
      }

      logger.info(`Call ${callId} initiated successfully`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error initiating call";
      logger.error(`Error initiating call: ${errorMessage}`, error);

      socket.emit("call:error", {
        message: errorMessage,
        context: "call_initiate_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle call acceptance
  socket.on("call:accept", async (data: Omit<CallResponseData, 'accepted' | 'timestamp'>, callback) => {
    try {
      logger.info(`Call acceptance from ${userId} for call ${data.callId}`);

      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      if (call.status !== CallStatus.RINGING) {
        throw new Error("Call is not in ringing state");
      }

      // Update call status
      callManager.updateCallStatus(data.callId, CallStatus.CONNECTING);

      // Notify caller that call was accepted
      emitToUser(io, data.from, "call:accepted", {
        callId: data.callId,
        from: userId,
        timestamp: new Date()
      });

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({
          success: true,
          callId: data.callId,
          status: CallStatus.CONNECTING
        });
      }

      logger.info(`Call ${data.callId} accepted`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error accepting call";
      logger.error(`Error accepting call: ${errorMessage}`, error);

      socket.emit("call:error", {
        message: errorMessage,
        context: "call_accept_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle call rejection
  socket.on("call:reject", async (data: Omit<CallResponseData, 'accepted' | 'timestamp'>, callback) => {
    try {
      logger.info(`Call rejection from ${userId} for call ${data.callId}`);

      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      // Update call status
      callManager.updateCallStatus(data.callId, CallStatus.REJECTED);

      // Notify caller that call was rejected
      emitToUser(io, data.from, "call:rejected", {
        callId: data.callId,
        from: userId,
        timestamp: new Date()
      });

      // Clean up call
      callManager.cleanupCall(data.callId);

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({
          success: true,
          callId: data.callId,
          status: CallStatus.REJECTED
        });
      }

      logger.info(`Call ${data.callId} rejected`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error rejecting call";
      logger.error(`Error rejecting call: ${errorMessage}`, error);

      socket.emit("call:error", {
        message: errorMessage,
        context: "call_reject_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle call end
  socket.on("call:end", async (data: Omit<CallEndData, 'timestamp'>, callback) => {
    try {
      logger.info(`Call end request from ${userId} for call ${data.callId}`);

      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      // Update call status
      callManager.endCall(data.callId, data.reason);

      // Get caller's username from socket data
      const callerUsername = socket.data.username || userId;

      // Notify other participants
      call.participants.forEach(participantId => {
        if (participantId !== userId) {
          emitToUser(io, participantId, "call:ended", {
            callId: data.callId,
            from: userId,
            fromUsername: callerUsername,
            reason: data.reason,
            timestamp: new Date()
          });
        }
      });

      // Clean up call
      callManager.cleanupCall(data.callId);

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({
          success: true,
          callId: data.callId,
          status: CallStatus.ENDED
        });
      }

      logger.info(`Call ${data.callId} ended`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error ending call";
      logger.error(`Error ending call: ${errorMessage}`, error);

      socket.emit("call:error", {
        message: errorMessage,
        context: "call_end_failed"
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle WebRTC offer
  socket.on("webrtc:offer", async (data: Omit<SDPData, 'timestamp'>, callback) => {
    try {
      logger.info(`WebRTC offer from ${userId} for call ${data.callId}`);

      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      // Forward offer to target user
      const success = emitToUser(io, data.to, "webrtc:offer", {
        ...data,
        timestamp: new Date()
      });

      if (!success) {
        throw new Error("Failed to deliver offer");
      }

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({ success: true });
      }

      logger.info(`WebRTC offer forwarded for call ${data.callId}`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error handling offer";
      logger.error(`Error handling WebRTC offer: ${errorMessage}`, error);

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle WebRTC answer
  socket.on("webrtc:answer", async (data: Omit<SDPData, 'timestamp'>, callback) => {
    try {
      logger.info(`WebRTC answer from ${userId} for call ${data.callId}`);

      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      // Update call status to connected
      callManager.updateCallStatus(data.callId, CallStatus.CONNECTED);

      // Forward answer to target user
      const success = emitToUser(io, data.to, "webrtc:answer", {
        ...data,
        timestamp: new Date()
      });

      if (!success) {
        throw new Error("Failed to deliver answer");
      }

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({ success: true });
      }

      logger.info(`WebRTC answer forwarded for call ${data.callId}`);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error handling answer";
      logger.error(`Error handling WebRTC answer: ${errorMessage}`, error);

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });

  // Handle ICE candidates
  socket.on("webrtc:ice-candidate", async (data: Omit<ICECandidateData, 'timestamp'>, callback) => {
    try {
      const call = callManager.getCall(data.callId);
      if (!call) {
        throw new Error("Call not found");
      }

      if (!call.participants.includes(userId)) {
        throw new Error("User not part of this call");
      }

      // Forward ICE candidate to target user
      const success = emitToUser(io, data.to, "webrtc:ice-candidate", {
        ...data,
        timestamp: new Date()
      });

      if (!success) {
        throw new Error("Failed to deliver ICE candidate");
      }

      // Send acknowledgment
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error handling ICE candidate";
      logger.error(`Error handling ICE candidate: ${errorMessage}`, error);

      if (typeof callback === 'function') {
        callback({
          success: false,
          error: errorMessage
        });
      }
    }
  });
};
