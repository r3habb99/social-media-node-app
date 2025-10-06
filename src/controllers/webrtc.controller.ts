import { Response } from "express";
import { AuthRequest, logger, sendResponse } from "../services";
import {
  initiateCall,
  endCall,
  getCallInfo,
  getUserCurrentCall,
  isUserInCall,
  isUserBusy,
  getAllActiveCalls,
  getCallStatistics
} from "../services/webrtcService";
import { CallType } from "../socket/types/webrtc.types";
import { HttpResponseMessages, HttpStatusCodes } from "../constants";

/**
 * Initiate a call between users
 */
export const initiateCallController = async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, callType, chatId } = req.body;
    const fromUserId = req.user?.id;

    if (!fromUserId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    // Validate input
    if (!toUserId || !callType) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Missing required fields: toUserId, callType"
      });
    }

    if (!Object.values(CallType).includes(callType)) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Invalid call type. Must be 'audio' or 'video'"
      });
    }

    // Initiate the call
    const result = await initiateCall(fromUserId, toUserId, callType, chatId);

    if (result.success) {
      logger.info(`Call initiated successfully via API`, {
        callId: result.callId,
        fromUserId,
        toUserId,
        callType
      });

      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: "Call initiated successfully",
        data: {
          callId: result.callId,
          status: "ringing"
        }
      });
    } else {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: result.error || "Failed to initiate call"
      });
    }
  } catch (error: any) {
    logger.error("Error in initiateCallController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};

/**
 * End a call
 */
export const endCallController = async (req: AuthRequest, res: Response) => {
  try {
    const { callId, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    if (!callId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Missing required field: callId"
      });
    }

    // End the call
    const result = await endCall(callId, userId, reason);

    if (result.success) {
      logger.info(`Call ended successfully via API`, {
        callId,
        userId,
        reason
      });

      return sendResponse({
        res,
        statusCode: HttpStatusCodes.OK,
        message: "Call ended successfully"
      });
    } else {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: result.error || "Failed to end call"
      });
    }
  } catch (error: any) {
    logger.error("Error in endCallController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};

/**
 * Get call information
 */
export const getCallInfoController = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    if (!callId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: "Missing required parameter: callId"
      });
    }

    const call = getCallInfo(callId);

    if (!call) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: "Call not found"
      });
    }

    // Check if user is part of this call
    if (!call.participants.includes(userId)) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.FORBIDDEN,
        message: "You are not part of this call"
      });
    }

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Call information retrieved successfully",
      data: call
    });
  } catch (error: any) {
    logger.error("Error in getCallInfoController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};

/**
 * Get user's current call
 */
export const getUserCurrentCallController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    const call = getUserCurrentCall(userId);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: call ? "Current call retrieved successfully" : "No active call",
      data: call
    });
  } catch (error: any) {
    logger.error("Error in getUserCurrentCallController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};

/**
 * Get user call status
 */
export const getUserCallStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    const inCall = isUserInCall(userId);
    const busy = isUserBusy(userId);
    const currentCall = getUserCurrentCall(userId);

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "User call status retrieved successfully",
      data: {
        inCall,
        busy,
        currentCall: currentCall ? {
          callId: currentCall.callId,
          status: currentCall.status,
          callType: currentCall.callType,
          participants: currentCall.participants,
          startTime: currentCall.startTime
        } : null
      }
    });
  } catch (error: any) {
    logger.error("Error in getUserCallStatusController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};

/**
 * Get all active calls (admin only)
 */
export const getAllActiveCallsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: HttpResponseMessages.UNAUTHORIZED
      });
    }

    // Note: In a real application, you'd want to check if the user is an admin
    // For now, we'll allow any authenticated user to see this for debugging

    const activeCalls = getAllActiveCalls();
    const statistics = getCallStatistics();

    return sendResponse({
      res,
      statusCode: HttpStatusCodes.OK,
      message: "Active calls retrieved successfully",
      data: {
        activeCalls,
        statistics
      }
    });
  } catch (error: any) {
    logger.error("Error in getAllActiveCallsController:", error);
    return sendResponse({
      res,
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: HttpResponseMessages.INTERNAL_SERVER_ERROR
    });
  }
};
