import { Router } from "express";
import { authMiddleware } from "../services";
import {
  initiateCallController,
  endCallController,
  getCallInfoController,
  getUserCurrentCallController,
  getUserCallStatusController,
  getAllActiveCallsController
} from "../controllers/webrtc.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CallInitiate:
 *       type: object
 *       required:
 *         - toUserId
 *         - callType
 *       properties:
 *         toUserId:
 *           type: string
 *           description: ID of the user to call
 *         callType:
 *           type: string
 *           enum: [audio, video]
 *           description: Type of call
 *         chatId:
 *           type: string
 *           description: Optional chat ID if call is within a chat context
 *     CallEnd:
 *       type: object
 *       required:
 *         - callId
 *       properties:
 *         callId:
 *           type: string
 *           description: ID of the call to end
 *         reason:
 *           type: string
 *           description: Optional reason for ending the call
 *     CallInfo:
 *       type: object
 *       properties:
 *         callId:
 *           type: string
 *         callType:
 *           type: string
 *           enum: [audio, video]
 *         status:
 *           type: string
 *           enum: [initiating, ringing, connecting, connected, ended, rejected, missed, failed]
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         initiator:
 *           type: string
 *         chatId:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: number
 */

/**
 * @swagger
 * /api/webrtc/call/initiate:
 *   post:
 *     summary: Initiate a call
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallInitiate'
 *     responses:
 *       200:
 *         description: Call initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     callId:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/call/initiate", authMiddleware, initiateCallController);

/**
 * @swagger
 * /api/webrtc/call/end:
 *   post:
 *     summary: End a call
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallEnd'
 *     responses:
 *       200:
 *         description: Call ended successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/call/end", authMiddleware, endCallController);

/**
 * @swagger
 * /api/webrtc/call/{callId}:
 *   get:
 *     summary: Get call information
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *         description: Call ID
 *     responses:
 *       200:
 *         description: Call information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CallInfo'
 *       404:
 *         description: Call not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/call/:callId", authMiddleware, getCallInfoController);

/**
 * @swagger
 * /api/webrtc/user/current-call:
 *   get:
 *     summary: Get user's current call
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current call retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CallInfo'
 *       401:
 *         description: Unauthorized
 */
router.get("/user/current-call", authMiddleware, getUserCurrentCallController);

/**
 * @swagger
 * /api/webrtc/user/status:
 *   get:
 *     summary: Get user's call status
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User call status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     inCall:
 *                       type: boolean
 *                     busy:
 *                       type: boolean
 *                     currentCall:
 *                       $ref: '#/components/schemas/CallInfo'
 *       401:
 *         description: Unauthorized
 */
router.get("/user/status", authMiddleware, getUserCallStatusController);

/**
 * @swagger
 * /api/webrtc/admin/active-calls:
 *   get:
 *     summary: Get all active calls (admin only)
 *     tags: [WebRTC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active calls retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeCalls:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CallInfo'
 *                     statistics:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/admin/active-calls", authMiddleware, getAllActiveCallsController);

export default router;
