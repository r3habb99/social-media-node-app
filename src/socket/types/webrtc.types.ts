import { Socket } from "socket.io";

// WebRTC Call Types
export enum CallType {
  AUDIO = "audio",
  VIDEO = "video"
}

export enum CallStatus {
  INITIATING = "initiating",
  RINGING = "ringing",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ENDED = "ended",
  REJECTED = "rejected",
  MISSED = "missed",
  FAILED = "failed"
}

// WebRTC Signaling Message Types
export enum SignalingType {
  OFFER = "offer",
  ANSWER = "answer",
  ICE_CANDIDATE = "ice-candidate",
  CALL_INITIATE = "call-initiate",
  CALL_ACCEPT = "call-accept",
  CALL_REJECT = "call-reject",
  CALL_END = "call-end",
  CALL_CANCEL = "call-cancel"
}

// Interface for WebRTC signaling data
export interface WebRTCSignalingData {
  type: SignalingType;
  callId: string;
  from: string;
  to: string;
  data?: any;
  timestamp: Date;
}

// Interface for call initiation
export interface CallInitiateData {
  callId: string;
  callType: CallType;
  from: string;
  to: string;
  chatId?: string;
  timestamp: Date;
}

// Interface for call response (accept/reject)
export interface CallResponseData {
  callId: string;
  from: string;
  to: string;
  accepted: boolean;
  timestamp: Date;
}

// Interface for ICE candidate
export interface ICECandidateData {
  callId: string;
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
  timestamp: Date;
}

// Interface for SDP offer/answer
export interface SDPData {
  callId: string;
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
  timestamp: Date;
}

// Interface for call end
export interface CallEndData {
  callId: string;
  from: string;
  to: string;
  reason?: string;
  timestamp: Date;
}

// Interface for active call tracking
export interface ActiveCall {
  callId: string;
  callType: CallType;
  status: CallStatus;
  participants: string[];
  initiator: string;
  chatId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// Interface for user call state
export interface UserCallState {
  userId: string;
  socketId: string;
  currentCall?: ActiveCall;
  isInCall: boolean;
  isBusy: boolean;
}

// Socket user data extended with call state
export interface SocketUserWithCall {
  userId: string;
  username: string;
  rooms: string[];
  callState?: UserCallState;
}

// WebRTC event handlers interface
export interface WebRTCEventHandlers {
  onCallInitiate: (socket: Socket, data: CallInitiateData) => void;
  onCallAccept: (socket: Socket, data: CallResponseData) => void;
  onCallReject: (socket: Socket, data: CallResponseData) => void;
  onCallEnd: (socket: Socket, data: CallEndData) => void;
  onOffer: (socket: Socket, data: SDPData) => void;
  onAnswer: (socket: Socket, data: SDPData) => void;
  onICECandidate: (socket: Socket, data: ICECandidateData) => void;
}

// Call manager interface
export interface CallManager {
  createCall: (callData: CallInitiateData) => ActiveCall;
  getCall: (callId: string) => ActiveCall | null;
  updateCallStatus: (callId: string, status: CallStatus) => void;
  endCall: (callId: string, reason?: string) => void;
  getUserCall: (userId: string) => ActiveCall | null;
  isUserInCall: (userId: string) => boolean;
  isUserBusy: (userId: string) => boolean;
  getAllActiveCalls: () => ActiveCall[];
  cleanupCall: (callId: string) => void;
}
