import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middelware';
import { UserService } from '../service/user.service.js';
import { VerificationStatus } from '../../../models/index.js';

const userService = new UserService();

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.getProfile(req.user!.userId);
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.updateProfile(req.user!.userId, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadIDProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idProofUrl } = req.body;
    const result = await userService.uploadIDProof(req.user!.userId, idProofUrl);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reviewIDVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const result = await userService.reviewIDVerification(req.params.userId as string, status as VerificationStatus);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingVerifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await userService.getPendingVerifications();
    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addEmergencyContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.addEmergencyContact(req.user!.userId, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmergencyContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contacts = await userService.getEmergencyContacts(req.user!.userId);
    res.status(200).json({ success: true, contacts });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmergencyContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.updateEmergencyContact(req.params.id as string, req.user!.userId, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmergencyContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.deleteEmergencyContact(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};